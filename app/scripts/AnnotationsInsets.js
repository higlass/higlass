import { range } from 'd3-array';
import { scaleQuantize } from 'd3-scale';
import rbush from 'rbush';

// Services
import { pubSub } from './services';

// Utils
import { positionLabels } from './utils';

class AnnotationsInsets {
  constructor(insetsTrack, options, getTrackByUid, animate) {
    this.getTrackByUid = getTrackByUid;
    this.animate = animate;
    this.options = options;

    this.insetsTrack = getTrackByUid(insetsTrack);

    if (!this.insetsTrack) {
      console.warn(`Insets track (uid: ${insetsTrack}) not found`, insetsTrack);
      return;
    }

    this.insetsTrack.subscribe('zoom', this.zoomHandler.bind(this));

    this.annotationTrackIds = new Set();
    this.annotationTracks = options.annotationTracks
      .map((uid) => {
        const track = getTrackByUid(uid);

        if (!track) console.warn(`Child track (uid: ${uid}) not found`);
        else this.annotationTrackIds.add(track.uuid);

        return track;
      })
      .filter(track => track);

    // Augment annotation tracks
    this.annotationTracks.forEach((track) => {
      track.subscribe(
        'annotationDrawn', this.annotationDrawnHandler.bind(this)
      );
    });

    this.currK = 1;  // Current scale
    this.drawnAnnoIds = new Set();
    this.insets = {};

    this.tracksDrawingTiles = new Set();

    this.initTree();

    this.pubSubs = [];
    this.pubSubs.push(pubSub.subscribe(
      'TiledPixiTrack.tilesDrawnEnd',
      this.tilesDrawnEndHandler.bind(this)
    ));
  }

  /**
   * Handles annotation drawn events
   *
   * @param  {String}  event.uid  UID of the view that triggered the event.
   * @param  {Array}  event.viewPos  View position (i.e., [x, y, width, height])
   *   of the drawn annotation.
   * @param  {Array}  event.dataPos  Data position of the drawn annotation.
   */
  annotationDrawnHandler({ uid, viewPos, dataPos }) {
    const locus = {
      uid,
      minX: viewPos[0],
      minY: viewPos[1],
      maxX: viewPos[0] + viewPos[2],
      maxY: viewPos[1] + viewPos[3],
      cX1: dataPos[0],
      cX2: dataPos[1],
      cY1: dataPos[2],
      cY2: dataPos[3]
    };

    this.newAnno = !this.drawnAnnoIdsOld.has(uid);
    this.drawnAnnoIds.add(uid);

    const width = this.insetsTrack.dimensions[0];
    const height = this.insetsTrack.dimensions[1];

    if (
      (
        viewPos[2] <= this.options.insetThreshold
        || viewPos[3] <= this.options.insetThreshold
      )
      &&
      (
        (locus.minX >= 0 || locus.maxX > 0)
        && (locus.minX < width || locus.maxX <= width)
        && (locus.minY >= 0 || locus.maxY > 0)
        && (locus.minY < height || locus.maxY <= height)
      )
    ) {
      const maxRemoteSize = Math.max(locus.cX2 - locus.cX1, locus.cY2 - locus.cY1);
      this.insetMinRemoteSize = Math.min(this.insetMinRemoteSize, maxRemoteSize);
      this.insetMaxRemoteSize = Math.max(this.insetMaxRemoteSize, maxRemoteSize);
      this.insetsToBeDrawn.push(locus);
      this.insetsToBeDrawnIds.add(uid);
    } else {
      this.drawnAnnotations.push(locus);
    }
  }

  /**
   * Build region tree of drawn annotations and trigger the creation of insets.
   */
  buildTree() {
    if (!this.drawnAnnotations.length && !this.insetsToBeDrawn.length) return;

    this.drawnAnnotations = [
      ...this.insetsToBeDrawn,
      ...this.drawnAnnotations
    ];
    if (this.newAnno) this.tree.load(this.drawnAnnotations);
    this.createInsets();
  }

  /**
   * Compute the final inset size in pixels from their remote size (e.g., base
   *   pairs or pixels)
   *
   * @param   {object}  inset  Inset definition object holding the remote size
   *   of the inset.
   * @param   {function}  scale  Translates between the remote size and the
   *   pixel size.
   * @return  {object}  Object holding the final pixel with and height.
   */
  computeSize(inset, scale) {
    const widthAbs = inset.cX2 - inset.cX1;
    const heightAbs = inset.cY2 - inset.cY1;

    const width = widthAbs >= heightAbs
      ? scale(widthAbs)
      : widthAbs / heightAbs * scale(heightAbs);
    const height = heightAbs >= widthAbs
      ? scale(heightAbs)
      : heightAbs / widthAbs * width;

    return { width, height };
  }

  /**
   * Create insets.
   */
  createInsets() {
    this.drawInsets(this.positionInsets(), this.insetsToBeDrawnIds);
  }

  /**
   * Draw positioned insets
   *
   * @param  {Array}  insets  Inset positions to be drawn.
   * @param  {Set}  insetIds  Inset IDs to be drawn.
   * @return  {Object}  Promise resolving once all insets are drawn.
   */
  drawInsets(insets, insetIds) {
    return Promise.all(this.insetsTrack.drawInsets(insets, insetIds))
      .then(() => { this.animate(); })
      .catch((e) => { this.animate(); console.error(e); });
  }

  /**
   * Initialize annotation RTree
   */
  initTree() {
    this.tree = rbush();
    this.oldAnnotations = this.drawnAnnotations;
    this.drawnAnnotations = [];
    this.oldInsets = this.insetsToBeDrawn;
    this.insetsToBeDrawn = [];
    this.insetsToBeDrawnIds = new Set();
    this.drawnAnnoIdsOld = this.drawnAnnoIds;
    this.drawnAnnoIds = new Set();
    this.newAnno = false;
    this.insetMinRemoteSize = Infinity;  // Larger dimension of the smallest inset
    this.insetMaxRemoteSize = 0;  // Larger dimension of the largest inset
    this.tracksDrawingTiles = new Set();
  }

  /**
   * Position insets using simulated annealing
   *
   * @return  {Array}  Position and dimension of the insets.
   */
  positionInsets() {
    if (!this.insetsToBeDrawn.length) return [];

    if (this.insetsTrack.positioning.location === 'gallery') {
      return this.positionInsetsGallery();
    }

    return this.positionInsetsCenter();
  }

  computeInsetSizeScale() {
    // Convert data (basepair position) to view (display pixel) resolution
    const finalRes = scaleQuantize()
      .domain([this.insetMinRemoteSize, this.insetMaxRemoteSize])
      .range(range(
        this.insetsTrack.insetMinSize * this.insetsTrack.insetScale,
        (this.insetsTrack.insetMaxSize * this.insetsTrack.insetScale) + 1,
        this.insetsTrack.options.sizeStepSize
      ));

    const newResScale = (
      this.insetMinRemoteSize !== this.insetMinRemoteSizeOld
      || this.insetMaxRemoteSize !== this.insetMaxRemoteSizeOld
    );

    // Update old remote size to avoid wiggling insets that did not change at
    // all
    this.insetMinRemoteSizeOld = this.insetMinRemoteSize;
    this.insetMaxRemoteSizeOld = this.insetMaxRemoteSize;

    return { finalRes, newResScale };
  }

  /**
   * Position insets within the heatmap using simulated annealing
   *
   * @param  {Array}  insetsToBeDrawn  Insets to be drawn
   * @return  {Array}  Position and dimension of the insets.
   */
  positionInsetsCenter(insetsToBeDrawn = this.insetsToBeDrawn) {
    const anchors = this.drawnAnnotations.map(obj => ({
      t: 1,
      x: (obj.maxX + obj.minX) / 2,
      y: (obj.maxY + obj.minY) / 2,
      ox: (obj.maxX + obj.minX) / 2,  // Origin x
      oy: (obj.maxY + obj.minY) / 2,  // Origin y
      wh: (obj.maxX - obj.minX) / 2,  // Width half
      hh: (obj.maxY - obj.minY) / 2,  // Heigth half
      ...obj
    }));

    const { finalRes, newResScale } = this.computeInsetSizeScale();

    const insets = insetsToBeDrawn
      .map((inset) => {
        if (!this.insets[inset.uid]) {
          const { width, height } = this.computeSize(inset, finalRes);

          // Add new inset
          this.insets[inset.uid] = {
            t: 1.0,
            x: (inset.maxX + inset.minX) / 2,
            y: (inset.maxY + inset.minY) / 2,
            ox: (inset.maxX + inset.minX) / 2,  // Origin x
            oy: (inset.maxY + inset.minY) / 2,  // Origin y
            owh: (inset.maxX - inset.minX) / 2,  // Origin width half
            ohh: (inset.maxY - inset.minY) / 2,  // Origin height half
            width,
            height,
            wh: width / 2,  // Width half
            hh: height / 2,  // Heigth half
            ...inset
          };
        } else {
          // Update existing inset positions
          const newOx = (inset.maxX + inset.minX) / 2;
          const newOy = (inset.maxY + inset.minY) / 2;
          const dX = this.insets[inset.uid].ox - newOx;
          const dY = this.insets[inset.uid].oy - newOy;

          this.insets[inset.uid].ox = newOx;
          this.insets[inset.uid].oy = newOy;
          this.insets[inset.uid].owh = (inset.maxX - inset.minX) / 2;
          this.insets[inset.uid].ohh = (inset.maxY - inset.minY) / 2;

          this.insets[inset.uid].x -= dX;
          this.insets[inset.uid].y -= dY;

          this.insets[inset.uid].t = this.scaleChanged ? 0.5 : 0;

          if (newResScale) {
            const { width, height } = this.computeSize(inset, finalRes);

            this.insets[inset.uid].width = width;
            this.insets[inset.uid].height = height;
            this.insets[inset.uid].wh = width / 2;
            this.insets[inset.uid].hh = height / 2;

            // Let them wobble a bit because the size changed
            this.insets[inset.uid].t = 0.25;
          }
        }

        return this.insets[inset.uid];
      });

    const insetsToBePositioned = insets
      .filter((inset) => {
        if (inset.t) return true;

        // Inset has cooled down (i.e., is already positions), hence, it is
        // filtered out and added to anchors instead.
        anchors.push(inset);
        return false;
      });

    if (insetsToBePositioned.length) {
      const t0 = performance.now();
      const n = insetsToBePositioned.length;

      positionLabels
        // Insets, i.e., labels
        .label(insetsToBePositioned)
        // Anchors, i.e., label origins, already positioned labels, and other
        // annotations
        .anchor(anchors)
        .width(this.insetsTrack.dimensions[0])
        .height(this.insetsTrack.dimensions[1])
        .start(Math.round(Math.max(2, Math.min(100 * Math.log(n) / n))));

      console.log(`Labeling took ${performance.now() - t0} msec`);
    }

    const pos = insets.map(inset => ([
      inset.uid,
      inset.x,
      inset.y,
      inset.width,
      inset.height,
      inset.ox,
      inset.oy,
      inset.owh,
      inset.ohh,
      inset.cX1,
      inset.cX2,
      inset.cY1,
      inset.cY2
    ]));

    return pos;
  }

  /**
   * Position insets along the gallery.
   *
   * @description
   * Technically we should not call the snippets insets anymore because they are
   * not drawn within the matrix anymore
   *
   * @param  {Array}  insetsToBeDrawn  Insets to be drawn
   * @return  {Array}  Position and dimension of the insets.
   */
  positionInsetsGallery(insetsToBeDrawn = this.insetsToBeDrawn) {
    const { finalRes, newResScale } = this.computeInsetSizeScale();

    // 1. Position insets to the closest position on the gallery border
    return this.positionInsetsGalleryNearestBorder(
      insetsToBeDrawn, finalRes
    );

    // 2. Optimize position using simulated annealing
  }

  /**
   * Position gallery insets to their nearest border location. That is the
   *   closest [x,y] location on the border of the center track. Count the
   *   numbr of insets falling within the same local neighborhood on the
   *   border and other insets close to the same location to spread insets
   *   out.
   *
   * @param   {array}  insetsToBeDrawn  Inset definition olding the position
   *   and size of the original locus defining the inset.
   * @param   {function}  finalRes  Translator between remote size and final
   *   pixel size.
   * @return  {array}  List of inset definitions holding the border position,
   *   pixel size, origin, and remote size.
   */
  positionInsetsGalleryNearestBorder(insetsToBeDrawn, finalRes) {
    // Maximum inset pixel size
    const insetMaxSize = (
      this.insetsTrack.insetMaxSize * this.insetsTrack.insetScale
    );
    const insetHalfSize = insetMaxSize / 2;

    // Dimensions and padding of the center track
    const centerWidth = (
      this.insetsTrack.dimensions[0]
      - (2 * this.insetsTrack.positioning.width)
    );
    const cwh = centerWidth / 2;
    const paddingX = (this.insetsTrack.positioning.height - insetMaxSize) / 2;
    const centerHeight = (
      this.insetsTrack.dimensions[1]
      - (2 * this.insetsTrack.positioning.height)
    );
    const chh = centerHeight / 2;
    const paddingY = (this.insetsTrack.positioning.height - insetMaxSize) / 2;

    // Initialize the border histogram for counting the number of instances
    // falling within the same border section.
    const binSizeX = centerWidth / Math.floor(centerWidth / insetMaxSize);
    const binsTop = Array(Math.floor(centerWidth / insetMaxSize)).fill(0);
    const binsBottom = Array.from(binsTop);
    const binSizeY = centerHeight / Math.floor(centerHeight / insetMaxSize);
    const binsLeft = Array(Math.floor(centerHeight / insetMaxSize)).fill(0);
    const binsRight = Array.from(binsLeft);

    return insetsToBeDrawn.map((inset) => {
      const { width, height } = this.computeSize(inset, finalRes);
      const ox = (inset.maxX + inset.minX) / 2;
      const oy = (inset.maxY + inset.minY) / 2;
      const offX = this.insetsTrack.positioning.offsetX;
      const offY = this.insetsTrack.positioning.offsetY;

      const xBinId = Math.floor(ox / binSizeX);
      const yBinId = Math.floor(oy / binSizeY);
      const penaltyTop = binsTop[xBinId];
      const penaltyBottom = binsBottom[xBinId];
      const penaltyLeft = binsLeft[yBinId];
      const penaltyRight = binsRight[yBinId];
      const xWithPenalty = ox + penaltyLeft - penaltyRight;
      const yWithPenalty = oy + penaltyTop - penaltyBottom;

      // Determine which border is the closest
      const isLeftCloser = xWithPenalty <= cwh;
      const xDistBorder = isLeftCloser ? xWithPenalty : centerWidth - xWithPenalty;
      const isTopCloser = yWithPenalty <= chh;
      const yDistBorder = isTopCloser ? yWithPenalty : centerHeight - yWithPenalty;
      const isXShorter = xDistBorder < yDistBorder;

      // Position insets to the closest border and update histogram
      let x;
      let y;
      if (isXShorter) {
        if (isLeftCloser) {
          x = offX - (width / 2) - paddingX;
          binsLeft[yBinId] += insetHalfSize;
        } else {
          x = offX + centerWidth + (width / 2) + paddingX;
          binsRight[yBinId] += insetHalfSize;
        }
        y = offY + inset.minY;
      } else {
        if (isTopCloser) {
          y = offY - (height / 2) - paddingY;
          binsTop[xBinId] += insetHalfSize;
        } else {
          y = offY + centerHeight + (height / 2) + paddingY;
          binsBottom[xBinId] += insetHalfSize;
        }
        x = offX + inset.minX;
      }

      return [
        inset.uid,
        x,
        y,
        width,
        height,
        ox + offX,  // Origin x
        oy + offY,  // Origin y
        (inset.maxX - inset.minX) / 2,  // Origin width half
        (inset.maxY - inset.minY) / 2,  // Origin height half
        inset.cX1,
        inset.cX2,
        inset.cY1,
        inset.cY2
      ];
    });
  }

  computeClosestBorder(x, y, width, height) {

  }

  /**
   * Remove this track.
   */
  remove() {
    this.pubSubs.forEach(sub => pubSub.unsubscribe(sub));
    this.pubSubs = undefined;
    this.annotationTracks.forEach((track) => {
      track.unsubscribe('annotationDrawn', this.annotationDrawnHandler.bind(this));
    });
  }

  /**
   * Callback function passed into the annotation tracks to trigger tree
   * building of the spatial RTree.
   *
   * @description
   * Simple counter that call `this.buildTree()` once the number of annotation
   * tracks is reached. This might need to be improved!=
   */
  tilesDrawnEndHandler({ uuid }) {
    if (!this.annotationTrackIds.has(uuid)) return;

    this.tracksDrawingTiles.add(uuid);

    if (!(this.tracksDrawingTiles.size % this.annotationTracks.length)) {
      this.buildTree();
    }
  }

  /**
   * Hook uo with the zoom event and trigger the r-tree initialization.
   * @param   {number}  options.k  New zoom level.
   */
  zoomHandler({ k }) {
    this.initTree();

    this.scaleChanged = this.currK !== k;
    this.currK = k;
  }
}

export default AnnotationsInsets;
