import { range } from 'd3-array';
import { scaleQuantize } from 'd3-scale';
import rbush from 'rbush';

// Services
import { pubSub } from './services';

// Factories
import {
  Annotation, AreaClusterer, GalleryLabel, KeySet, LabelCluster
} from './factories';

// Utils
import {
  identity, latToY, lngToX, positionLabels
} from './utils';

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

    this.insetsTrack.subscribe('dimensions', this.updateBounds.bind(this));
    this.insetsTrack.subscribe('position', this.updateBounds.bind(this));
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
    this.annosToBeDrawnAsInsets = new KeySet('id');
    this.insets = {};

    this.tracksDrawingTiles = new Set();

    this.initTree();

    this.pubSubs = [];
    this.pubSubs.push(pubSub.subscribe(
      'TiledPixiTrack.tilesDrawnEnd',
      this.tilesDrawnEndHandler.bind(this)
    ));

    // Yet another transformation (oh lord please let this be the last one...)
    // Some coordinate systems (so far only geography) displays the original
    // coordinates are projected locations. Hence, we end with view coordinates
    // (pixel location on the screen), data location (longitude and latitude),
    // and finally projected data locations. Currently we only support mercator
    // but who know... more might come. Anyway, we need this extra projection to
    // have zoom-independent data locations at the correct visual ratio.
    this.projectorX = this.insetsTrack.dataType === 'osm-image'
      ? lng => lngToX(lng, 19)
      : identity;

    this.projectorY = this.insetsTrack.dataType === 'osm-image'
      ? lat => latToY(lat, 19)
      : identity;

    this.areaClusterer = new AreaClusterer({
      gridSize: 50,
      minClusterSize: 3,
      maxZoom: undefined,
    });

    this.insetsTrackWidth = 0;
    this.insetsTrackHeight = 0;
  }

  /**
   * Handles annotation drawn events
   *
   * @param  {String}  event.uid  UID of the view that triggered the event.
   * @param  {Array}  event.viewPos  View position (i.e., [x, y, width, height])
   *   of the drawn annotation on the screen.
   * @param  {Array}  event.dataPos  Data position of the drawn annotation. For
   *   example base pairs (Hi-C), or pixels (gigapixel images), or lng-lat
   *   (geo json).
   */
  annotationDrawnHandler({ uid, viewPos, dataPos }) {
    const dataPosProj = [
      this.projectorX(dataPos[0]),
      this.projectorX(dataPos[1]),
      this.projectorY(dataPos[2]),
      this.projectorY(dataPos[3])
    ];

    const _viewPos = [
      viewPos[0],
      viewPos[0] + viewPos[2],
      viewPos[1],
      viewPos[1] + viewPos[3],
    ];

    let annotation = this.areaClusterer.elements.get(uid);
    if (annotation) {
      annotation.setViewPosition(_viewPos);
    } else {
      annotation = new Annotation(uid, _viewPos, dataPos, dataPosProj);
    }

    this.drawnAnnoIds.add(uid);

    if (!this.drawnAnnoIdsPrev.has(uid)) {
      this.newAnno = true;
      this.drawnAnnoIdsNew.add(uid);
    }

    if (
      (
        viewPos[2] <= this.options.insetThreshold
        || viewPos[3] <= this.options.insetThreshold
      )
      &&
      (
        (annotation.minX >= 0 || annotation.maxX > 0)
        && (annotation.minX < this.insetsTrackWidth || annotation.maxX <= this.insetsTrackWidth)
        && (annotation.minY >= 0 || annotation.maxY > 0)
        && (annotation.minY < this.insetsTrackHeight || annotation.maxY <= this.insetsTrackHeight)
      )
    ) {
      const remoteSize = Math.max(
        annotation.maxXDataProj - annotation.minXDataProj,
        annotation.maxYDataProj - annotation.minYDataProj
      );
      this.insetMinRemoteSize = Math.min(this.insetMinRemoteSize, remoteSize);
      this.insetMaxRemoteSize = Math.max(this.insetMaxRemoteSize, remoteSize);
      this.annosToBeDrawnAsInsets.add(annotation);
    }

    this.drawnAnnotations.push(annotation);
  }

  /**
   * Build region tree of drawn annotations and trigger the creation of insets.
   */
  buildTree() {
    if (!this.drawnAnnotations.length && !this.annosToBeDrawnAsInsets.size) return;

    if (this.newAnno) this.tree.load(this.drawnAnnotations);

    this.createInsets();
  }

  compInsetSizeScale() {
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

  compInsetSizeScaleClustSize(clusters) {
    // Convert cluster size to view (display pixel) resolution
    const finalRes = scaleQuantize()
      .domain([1, clusters.clustersMaxSize])
      .range(range(
        this.insetsTrack.insetMinSize * this.insetsTrack.insetScale,
        (this.insetsTrack.insetMaxSize * this.insetsTrack.insetScale) + 1,
        this.insetsTrack.options.sizeStepSize
      ));

    const newResScale = clusters.maxClusterSize !== this.clustersMaxSize;

    // Update old remote size to avoid wiggling insets that did not change at
    // all
    this.clustersMaxSizeOld = clusters.maxClusterSize;

    return { finalRes, newResScale };
  }

  /**
   * Compute the final cluster size in pixels from their remote size (e.g., base
   *   pairs or pixels)
   *
   * @param   {object}  inset  Inset definition object holding the remote size
   *   of the inset.
   * @param   {function}  scale  Translates between the remote size and the
   *   pixel size.
   * @return  {object}  Object holding the final pixel with and height.
   */
  compInsetSize(inset, scale) {
    const widthAbs = Math.abs(inset.maxXDataProj - inset.minXDataProj);
    const heightAbs = Math.abs(inset.maxYDataProj - inset.minYDataProj);

    const width = widthAbs >= heightAbs
      ? scale(widthAbs)
      : widthAbs / heightAbs * scale(heightAbs);
    const height = heightAbs >= widthAbs
      ? scale(heightAbs)
      : heightAbs / widthAbs * width;

    return { width, height };
  }

  compInsetSizeCluster(cluster, scale) {
    const [minX, maxX, minY, maxY] = cluster.getAvgDataProjPos();

    const widthAbs = Math.abs(maxX - minX);
    const heightAbs = Math.abs(maxY - minY);

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
    // Determine old annotations
    this.annosToBeDrawnAsInsetsOld = this.annosToBeDrawnAsInsetsPrev
      .filter(anno => !this.annosToBeDrawnAsInsets.has(anno));

    this.clusterAnnotations();
    this.drawInsets(this.positionInsets());
  }

  clusterAnnotations() {
    // Update clusterer
    // const t0 = performance.now();
    this.areaClusterer.add(this.annosToBeDrawnAsInsets, true);
    this.areaClusterer.remove(this.annosToBeDrawnAsInsetsOld, true);
    this.areaClusterer.refresh();
    this.areaClusterer.clusterElements();
    // console.log(`Clustering took ${performance.now() - t0}ms`);
  }

  /**
   * Draw positioned insets
   *
   * @param  {KeySet}  insets  Inset positions to be drawn.
   * @return  {Object}  Promise resolving once all insets are drawn.
   */
  drawInsets(insets) {
    return Promise.all(this.insetsTrack.drawInsets(insets))
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
    this.annosToBeDrawnAsInsetsPrev = this.annosToBeDrawnAsInsets.clone();
    this.annosToBeDrawnAsInsets = new KeySet('id');
    this.annosToBeDrawnAsInsetsOld = new KeySet('id');
    this.drawnAnnoIdsNew = new Set();
    this.drawnAnnoIdsPrev = this.drawnAnnoIds;
    this.drawnAnnoIds = new Set();
    this.drawnAnnoIdsNew = new Set();
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
    if (!this.annosToBeDrawnAsInsets.size) return new KeySet();

    return this.insetsTrack.positioning.location === 'gallery'
      ? this.positionInsetsGallery()
      : this.positionInsetsCenter();
  }

  /**
   * Position insets within the heatmap using simulated annealing
   *
   * @param  {Array}  annosToBeDrawnAsInsets  Insets to be drawn
   * @return  {Array}  Position and dimension of the insets.
   */
  positionInsetsCenter(labelClusteres = this.areaClusterer.clusters) {
    const anchors = this.drawnAnnotations.map(annotation => ({
      t: 1.0,
      x: (annotation.maxX + annotation.minX) / 2,
      y: (annotation.maxY + annotation.minY) / 2,
      oX: (annotation.maxX + annotation.minX) / 2,  // Origin x
      oY: (annotation.maxY + annotation.minY) / 2,  // Origin y
      wH: (annotation.maxX - annotation.minX) / 2,  // Width half
      hH: (annotation.maxY - annotation.minY) / 2,  // Heigth half
    }));

    const {
      finalRes, newResScale
    } = this.compInsetSizeScaleClustSize(labelClusteres);

    const insets = new KeySet('id', labelClusteres
      .translate((inset) => {
        if (!this.insets[inset.id]) {
          const { width, height } = this.compInsetSizeCluster(inset, finalRes);

          // Create new Label for the AreaCluster
          this.insets[inset.id] = new LabelCluster(inset.id)
            .setDim(width, height).setSrc(inset);
        } else {
          // Update existing inset positions
          const newOx = (inset.maxX + inset.minX) / 2;
          const newOy = (inset.maxY + inset.minY) / 2;
          const dX = this.insets[inset.id].oX - newOx;
          const dY = this.insets[inset.id].oY - newOy;

          this.insets[inset.id].oX = newOx;
          this.insets[inset.id].oY = newOy;
          this.insets[inset.id].owh = (inset.maxX - inset.minX) / 2;
          this.insets[inset.id].ohh = (inset.maxY - inset.minY) / 2;

          this.insets[inset.id].x -= dX;
          this.insets[inset.id].y -= dY;

          this.insets[inset.id].t = this.scaleChanged ? 0.5 : 0;

          if (newResScale) {
            const { width, height } = this.compInsetSizeCluster(inset, finalRes);

            this.insets[inset.id].width = width;
            this.insets[inset.id].height = height;
            this.insets[inset.id].wH = width / 2;
            this.insets[inset.id].hH = height / 2;

            // Let them wobble a bit because the size changed
            this.insets[inset.id].t = 0.25;
          }
        }

        return this.insets[inset.id];
      }));

    const insetsToBePositioned = insets
      .filter((inset) => {
        if (inset.t) return true;

        // Inset has cooled down (i.e., is already positioned), hence, it is
        // filtered out and added to anchors instead.
        anchors.push(inset);
        return false;
      });

    if (insetsToBePositioned.size) {
      // const t0 = performance.now();
      const n = insetsToBePositioned.size;

      positionLabels
        // Insets, i.e., labels
        .label(insetsToBePositioned.values)
        // Anchors, i.e., label origins, already positioned labels, and other
        // annotations
        .anchor(anchors)
        .width(this.insetsTrack.dimensions[0])
        .height(this.insetsTrack.dimensions[1])
        .start(Math.round(Math.max(2, Math.min(100 * Math.log(n) / n))));

      // console.log(`Positioning took ${performance.now() - t0} msec`);
    }

    return insets;
  }

  /**
   * Position insets along the gallery.
   *
   * @description
   * Technically we should not call the snippets insets anymore because they are
   * not drawn within the matrix anymore
   *
   * @param  {Array}  annosToBeDrawnAsInsets  Insets to be drawn
   * @return  {Array}  Position and dimension of the insets.
   */
  positionInsetsGallery(annosToBeDrawnAsInsets = this.annosToBeDrawnAsInsets) {
    const { finalRes, newResScale } = this.compInsetSizeScale();

    // 1. Position insets to the closest position on the gallery border
    const insets = this.positionInsetsGalleryNearestBorder(
      annosToBeDrawnAsInsets, finalRes, newResScale
    );

    const offX = this.insetsTrack.positioning.offsetX;
    const offY = this.insetsTrack.positioning.offsetY;
    const anchors = this.drawnAnnotations.map(annotation => ({
      t: 1.0,
      x: ((annotation.maxX + annotation.minX) / 2) + offX,
      y: ((annotation.maxY + annotation.minY) / 2) + offY,
      oX: ((annotation.maxX + annotation.minX) / 2) + offX,  // Origin x
      oY: ((annotation.maxY + annotation.minY) / 2) + offY,  // Origin y
      wH: (annotation.maxX - annotation.minX) / 2,  // Width half
      hH: (annotation.maxY - annotation.minY) / 2,  // Heigth half
      // ...obj
    }));

    // 2. Optimize position using simulated annealing
    const insetsToBeAnnealed = insets
      .filter((inset) => {
        if (inset.t) return true;

        // Inset has cooled down (i.e., is already positioned), hence, it is
        // filtered out and added to anchors instead.
        anchors.push(inset);
        return false;
      });

    if (insetsToBeAnnealed.length) {
      const t0 = performance.now();
      const n = insetsToBeAnnealed.length;

      positionLabels
        // Insets, i.e., labels
        .label(insetsToBeAnnealed)
        // Anchors, i.e., label origins, already positioned labels, and other
        // annotations
        .anchor(anchors)
        .is1dOnly()
        .width(this.insetsTrack.dimensions[0])
        .height(this.insetsTrack.dimensions[1] - (2 * this.insetsTrack.positioning.height))
        .start(Math.round(Math.max(2, Math.min(100 * Math.log(n) / n))));

      console.log(`Labeling took ${performance.now() - t0} msec`);
    }

    return insets;
  }

  /**
   * Position gallery insets to their nearest border location. That is the
   *   closest [x,y] location on the border of the center track. Count the
   *   numbr of insets falling within the same local neighborhood on the
   *   border and other insets close to the same location to spread insets
   *   out.
   *
   * @param   {array}  annosToBeDrawnAsInsets  Inset definition olding the position
   *   and size of the original locus defining the inset.
   * @param   {function}  finalRes  Translator between remote size and final
   *   pixel size.
   * @return  {array}  List of inset definitions holding the border position,
   *   pixel size, origin, and remote size.
   */
  positionInsetsGalleryNearestBorder(annosToBeDrawnAsInsets, finalRes, newResScale) {
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
    const binSizeY = centerHeight / Math.floor(centerHeight / insetMaxSize);
    const binsTop = Array(Math.floor(centerWidth / insetMaxSize)).fill(0);
    const binsBottom = Array.from(binsTop);
    const binsLeft = Array(Math.floor(centerHeight / insetMaxSize)).fill(0);
    const binsRight = Array.from(binsLeft);

    const offX = this.insetsTrack.positioning.offsetX;
    const offY = this.insetsTrack.positioning.offsetY;

    return annosToBeDrawnAsInsets.map((inset) => {
      const _inset = this.insets[inset.id];
      if (_inset) {
        // Update existing inset positions
        const newOx = ((inset.maxX + inset.minX) / 2) + offX;
        const newOy = ((inset.maxY + inset.minY) / 2) + offY;
        const dX = _inset.oX - newOx;
        const dY = _inset.oY - newOy;

        _inset.oX = newOx;
        _inset.oY = newOy;
        _inset.owh = (inset.maxX - inset.minX) / 2;
        _inset.ohh = (inset.maxY - inset.minY) / 2;

        _inset.x -= _inset.isVerticalOnly ? 0 : dX;
        _inset.y -= _inset.isVerticalOnly ? dY : 0;

        _inset.t = this.scaleChanged ? 0.5 : 0;

        if (newResScale) {
          const { width, height } = this.compInsetSize(inset, finalRes);

          _inset.width = width;
          _inset.height = height;
          _inset.wH = width / 2;
          _inset.hH = height / 2;

          _inset.x = _inset.isVerticalOnly
            ? _inset.isLeftCloser
              ? offX - _inset.wH - paddingX
              : offX + _inset.wH + paddingX + centerWidth
            : _inset.x;
          _inset.y = _inset.isVerticalOnly
            ? _inset.y
            : _inset.isTopCloser
              ? offY - _inset.hH - paddingY
              : offY + _inset.hH + paddingY + centerHeight;

          // Let them wobble a bit because the size changed
          _inset.t = 0.25;
        }

        return _inset;
      }

      const { width, height } = this.compInsetSize(inset, finalRes);
      const oX = (inset.maxX + inset.minX) / 2;
      const oY = (inset.maxY + inset.minY) / 2;

      const xBinId = Math.floor(oX / binSizeX);
      const yBinId = Math.floor(oY / binSizeY);
      const penaltyTop = binsTop[xBinId];
      const penaltyBottom = binsBottom[xBinId];
      const penaltyLeft = binsLeft[yBinId];
      const penaltyRight = binsRight[yBinId];
      const xWithPenalty = oX + penaltyLeft - penaltyRight;
      const yWithPenalty = oY + penaltyTop - penaltyBottom;

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

      this.insets[inset.id] = new GalleryLabel(
        inset.id, width, height, [inset]
      );

      this.insets[inset.id].setXY(x, y);
      this.insets[inset.id].setOffSet(offX, offY);
      this.insets[inset.id].updateOrigin();
      this.insets[inset.id].setVerticalOnly(isXShorter);
      this.insets[inset.id].setLeftCloser(isLeftCloser);
      this.insets[inset.id].setTopCloser(isTopCloser);

      return this.insets[inset.id];
    });
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

  updateBounds() {
    this.insetsTrackWidth = (
      this.insetsTrack.dimensions[0] -
      (2 * this.insetsTrack.positioning.offsetX)
    );
    this.insetsTrackHeight = (
      this.insetsTrack.dimensions[1] -
      (2 * this.insetsTrack.positioning.offsetY)
    );

    this.areaClusterer.setBounds(
      0,
      this.insetsTrackWidth,
      0,
      this.insetsTrackHeight,
    );
  }

  /**
   * Hook up with the zoom event and trigger the r-tree initialization.
   * @param   {number}  options.k  New zoom level.
   */
  zoomHandler({ k }) {
    this.initTree();

    this.scaleChanged = this.currK !== k;
    this.currK = k;
  }
}

export default AnnotationsInsets;
