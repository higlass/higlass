import { range } from 'd3-array';
import { scaleQuantize } from 'd3-scale';
import rbush from 'rbush';

// Services
import { pubSub } from './services';

// Factories
import {
  Annotation, AreaClusterer, KeySet, LabelCluster, LabelClusterGallery
} from './factories';

// Utils
import {
  identity, getClusterPropAcc, latToY, lngToX, positionLabels
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

    this.insetsTrackWidth = 0;
    this.insetsTrackHeight = 0;

    const propChecks = [];

    this.clusterSizePropAcc = getClusterPropAcc(
      this.insetsTrack.options.scaleSizeBy
    );
    propChecks.push(['size', this.clusterSizePropAcc]);

    if (this.insetsTrack.options.scaleBorderBy) {
      this.clusterBorderPropAcc = getClusterPropAcc(
        this.insetsTrack.options.scaleBorderBy
      );
      propChecks.push(['border', this.clusterBorderPropAcc]);
    }

    this.areaClusterer = new AreaClusterer({
      gridSize: 50,
      minClusterSize: 3,
      maxZoom: undefined,
      disabled: !!this.options.disableClustering,
      propCheck: propChecks
    });

    this.isRepresentatives = this.insetsTrack.dataType.indexOf('image') >= 0;
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
  annotationDrawnHandler({ uid, viewPos, dataPos, importance }) {
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
      annotation = new Annotation(
        uid, _viewPos, dataPos, dataPosProj, importance
      );
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
    ) this.annosToBeDrawnAsInsets.add(annotation);

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

  /**
   * Compute scale for an optional property mapped onto the border of the inset
   * @return  {object}  [description]
   */
  compInsetBorderScale() {
    const borderScale = scaleQuantize()
      .domain([
        this.areaClusterer.propCheck.border.min,
        this.areaClusterer.propCheck.border.max
      ])
      .range(range(1, 10));

    return borderScale;
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
  compInsetSize(cluster, scale) {
    const [minX, maxX, minY, maxY] = cluster.getAvgDataProjPos();

    const widthAbs = Math.abs(maxX - minX);
    const heightAbs = Math.abs(maxY - minY);
    const maxDim = scale(this.clusterSizePropAcc(cluster));
    const isLandscape = widthAbs >= heightAbs;
    const isWithRepresentatives = this.isRepresentatives && cluster.size > 1;

    let width = isLandscape || isWithRepresentatives
      ? maxDim
      : widthAbs / heightAbs * maxDim;
    let height = !isLandscape || isWithRepresentatives
      ? maxDim
      : heightAbs / widthAbs * width;

    let addWidth = 0;
    let addheight = 0;
    if (isWithRepresentatives) {
      // The maximum gallery image might be subject to change
      const effectiveSize = Math.min(4, cluster.size);

      switch (effectiveSize) {
        case 2:
          addWidth = width * 0.6;
          addheight = -height * 0.6;
          break;

        case 3:
          addWidth = width * 0.8;
          addheight = height * 0.2;
          break;

        case 4:
          addWidth = (width * 1.75 * 1.3) - width;
          addheight = height * 0.70625;
          break;

        default:
          // Nothing
      }
    }

    width += addWidth;
    height += addheight;

    return { width, height };
  }

  compInsetSizeScale() {
    // Convert cluster size to view (display pixel) resolution
    const finalRes = scaleQuantize()
      .domain([
        this.areaClusterer.propCheck.size.min,
        this.areaClusterer.propCheck.size.max
      ])
      .range(range(
        this.insetsTrack.insetMinSize * this.insetsTrack.insetScale,
        (this.insetsTrack.insetMaxSize * this.insetsTrack.insetScale) + 1,
        this.insetsTrack.options.sizeStepSize
      ));

    const newResScale = (
      this.clustersSizeMinValueOld !== this.areaClusterer.propCheck.size.min
      || this.clustersSizeMaxValueOld !== this.areaClusterer.propCheck.size.max
    );

    // Update old remote size to avoid wiggling insets that did not change at
    // all
    this.clustersSizeMinValueOld = this.areaClusterer.propCheck.size.min;
    this.clustersSizeMaxValueOld = this.areaClusterer.propCheck.size.max;

    return { finalRes, newResScale };
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
    this.areaClusterer.eval(this.isZoomedIn);
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
    let borderScale;
    if (this.insetsTrack.options.scaleBorderBy) {
      borderScale = this.compInsetBorderScale();
    }

    return Promise.all(this.insetsTrack.drawInsets(insets, borderScale))
      .then(() => { this.animate(); })
      .catch((e) => {
        this.animate();
        if (e !== 'hiccup') console.error(e);
      });
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
   * @param  {KeySet}  areaClusters  Set of area clusters.
   * @return  {Array}  Position and dimension of the insets.
   */
  positionInsetsCenter(areaClusters = this.areaClusterer.clusters) {
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
    } = this.compInsetSizeScale(areaClusters);

    const insets = new KeySet('id', areaClusters
      .translate((cluster) => {
        const id = cluster.id;

        if (!this.insets[id]) {
          const {
            width, height
          } = this.compInsetSize(cluster, finalRes);

          // Create new Label for the AreaCluster
          this.insets[id] = new LabelCluster(id)
            .setDim(width, height)
            .setSrc(cluster);
        } else {
          // Update existing inset positions
          const newOx = (cluster.maxX + cluster.minX) / 2;
          const newOy = (cluster.maxY + cluster.minY) / 2;
          const dX = this.insets[id].oX - newOx;
          const dY = this.insets[id].oY - newOy;

          this.insets[id].oX = newOx;
          this.insets[id].oY = newOy;
          this.insets[id].owh = (cluster.maxX - cluster.minX) / 2;
          this.insets[id].ohh = (cluster.maxY - cluster.minY) / 2;

          this.insets[id].x -= dX;
          this.insets[id].y -= dY;

          this.insets[id].t = this.scaleChanged ? 0.5 : 0;

          if (cluster.reload || newResScale) {
            const {
              width, height
            } = this.compInsetSize(cluster, finalRes);

            this.insets[id].width = width;
            this.insets[id].height = height;
            this.insets[id].wH = width / 2;
            this.insets[id].hH = height / 2;
          }

          if (newResScale) {
            // Let them wobble a bit because the size changed
            this.insets[id].t = 0.25;
          }
        }

        return this.insets[id];
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
        .padding(5)
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
   * @param  {KeySet}  areaClusters  Set of area clusters.
   * @return  {Array}  Position and dimension of the insets.
   */
  positionInsetsGallery(areaClusters = this.areaClusterer.clusters) {
    const {
      finalRes, newResScale
    } = this.compInsetSizeScale(areaClusters);

    // 1. Position insets to the closest position on the gallery border
    const insets = this.positionInsetsGalleryNearestBorder(
      areaClusters, finalRes, newResScale
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

    if (insetsToBeAnnealed.size) {
      // const t0 = performance.now();
      const n = insetsToBeAnnealed.size;

      positionLabels
        // Insets, i.e., labels
        .label(insetsToBeAnnealed.values)
        // Anchors, i.e., label origins, already positioned labels, and other
        // annotations
        .anchor(anchors)
        .is1dOnly()
        .width(this.insetsTrack.dimensions[0])
        .height(
          this.insetsTrack.dimensions[1] -
          (2 * this.insetsTrack.positioning.height)
        )
        .start(Math.round(Math.max(2, Math.min(100 * Math.log(n) / n))));

      // console.log(`Gallery positioning took ${performance.now() - t0} msec`);
    }

    return insets;
  }

  /**
   * Position gallery insets to their nearest border location. That is the
   *   closest [x,y] location on the border of the center track. Count the
   *   numbr of insets falling within the same local neighborhood on the
   *   border and other insets close to the same location to spread insets
   *   out.
   * @param  {KeySet}  areaClusters  Set of area clusters.
   * @param   {function}  finalRes  Translator between remote size and final
   *   pixel size.
   * @return  {array}  List of inset definitions holding the border position,
   *   pixel size, origin, and remote size.
   */
  positionInsetsGalleryNearestBorder(areaClusters, finalRes, newResScale) {
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

    return new KeySet('id', areaClusters.translate((cluster) => {
      const c = this.insets[cluster.id];
      if (c) {
        // Update existing inset positions
        const newOx = ((cluster.maxX + cluster.minX) / 2) + offX;
        const newOy = ((cluster.maxY + cluster.minY) / 2) + offY;
        const dX = c.oX - newOx;
        const dY = c.oY - newOy;

        c.oX = newOx;
        c.oY = newOy;
        c.owh = (cluster.maxX - cluster.minX) / 2;
        c.ohh = (cluster.maxY - cluster.minY) / 2;

        c.x -= c.isVerticalOnly ? 0 : dX;
        c.y -= c.isVerticalOnly ? dY : 0;

        c.t = this.scaleChanged ? 0.5 : 0;

        if (newResScale) {
          const {
            width, height
          } = this.compInsetSize(cluster, finalRes);

          c.width = width;
          c.height = height;
          c.wH = width / 2;
          c.hH = height / 2;

          c.x = c.isVerticalOnly
            ? c.isLeftCloser
              ? offX - c.wH - paddingX
              : offX + c.wH + paddingX + centerWidth
            : c.x;
          c.y = c.isVerticalOnly
            ? c.y
            : c.isTopCloser
              ? offY - c.hH - paddingY
              : offY + c.hH + paddingY + centerHeight;

          // Let them wobble a bit because the size changed
          c.t = 0.25;
        }

        return c;
      }

      const { width, height } = this.compInsetSize(cluster, finalRes);
      const oX = (cluster.maxX + cluster.minX) / 2;
      const oY = (cluster.maxY + cluster.minY) / 2;

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
        y = offY + cluster.minY;
      } else {
        if (isTopCloser) {
          y = offY - (height / 2) - paddingY;
          binsTop[xBinId] += insetHalfSize;
        } else {
          y = offY + centerHeight + (height / 2) + paddingY;
          binsBottom[xBinId] += insetHalfSize;
        }
        x = offX + cluster.minX;
      }

      // Create new Label for the AreaCluster
      const labelCluster = new LabelClusterGallery(cluster.id)
        .setDim(width, height)
        .setSrc(cluster);

      labelCluster.setXY(x, y);
      labelCluster.setOffSet(offX, offY);
      labelCluster.updateOrigin();
      labelCluster.setVerticalOnly(isXShorter);
      labelCluster.setLeftCloser(isLeftCloser);
      labelCluster.setTopCloser(isTopCloser);

      this.insets[cluster.id] = labelCluster;

      return labelCluster;
    }));
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

    this.isZoomedIn = k > this.currK;

    this.scaleChanged = this.currK !== k;
    this.currK = k;
  }
}

export default AnnotationsInsets;
