import rbush from 'rbush';

// Components
import Insets2dTrack from './Insets2dTrack';

// Services
import { pubSub } from './services';

// Utils
import { colorToHex, positionLabels } from './utils';

class Combined2dAnnotationsTrack {
  constructor(scene, trackDefs, options, trackCreator, animate) {
    this.childTrackUuids = {};
    this.annotationTracks = trackDefs.map((trackDef) => {
      const track = trackCreator(trackDef);

      // Augment track options
      track.annotationDrawn = this.annotationDrawn.bind(this);
      track.animate = animate;
      this.childTrackUuids[track.uuid] = true;

      return track;
    });

    this.pubSubs = [];

    this.pubSubs.push(
      pubSub.subscribe('TiledPixiTrack.tilesDrawn', this.trackDrawn.bind(this))
    );

    if (this.annotationTracks.some(childTrack => !childTrack)) {
      console.error('Empty child track in Combined2dAnnotationsTrack:', this);
    }

    this.animate = animate;

    this.insetsTrack = new Insets2dTrack(scene, animate, {
      server: options.server,
      chromInfoPath: options.chromInfoPath,
      heatmapUuid: options.heatmapUuid,
      fill: colorToHex(options.insetFill || 'black'),
      fillOpacity: +options.insetFillOpacity || 0.5,
      borderWidth: +options.insetBorderWidth || 1,
      borderColor: colorToHex(options.insetBorderColor || 'black'),
      borderOpacity: +options.insetBorderOpacity || 1,
      leaderLineWidth: +options.insetLeaderLineWidth || 1,
      leaderLineColor: colorToHex(options.insetLeaderLineColor || 'black'),
      leaderLineOpacity: +options.insetLeaderLineOpacity || 1,
      dropDistance: +options.insetDropDistance || 3,
      dropBlur: +options.insetDropBlur || 3,
      dropOpacity: +options.insetDropOpacity || 1,
      opacity: +options.opacity || 1
    });

    this.childTracks = [...this.annotationTracks, this.insetsTrack];

    this.options = options;

    this.currK = 1;  // Current scale
    this.drawnAnnoIdx = new Set();
    this.insets = {};

    this.initTree();
  }

  remove() {
    super.remove();
    this.pubSubs.forEach(sub => pubSub.unsubscribe(sub));
    this.pubSubs = undefined;
    this.childTracks.forEach(childTracks => childTracks.remove());
  }

  buildTree() {
    if (!this.drawnAnnotations.length) return;
    // console.log('build tree', this.drawnAnnotations.length);

    this.drawnAnnotations = [
      ...this.insetsToBeDrawn,
      ...this.drawnAnnotations
    ];
    if (this.newAnno) this.tree.load(this.drawnAnnotations);
    this.createInsets();
  }

  annotationDrawn(uid, x, y, w, h, cX1, cX2, cY1, cY2) {
    const locus = {
      uid,
      minX: x,
      minY: y,
      maxX: x + w,
      maxY: y + h,
      cX1,
      cX2,
      cY1,
      cY2
    };

    this.newAnno = !this.drawnAnnoIdxOld.has(uid);
    this.drawnAnnoIdx.add(uid);

    if (
      w <= this.options.insetThreshold ||
      h <= this.options.insetThreshold
    ) {
      this.insetsToBeDrawn.push(locus);
      this.insetsToBeDrawnIds.add(uid);
    } else {
      this.drawnAnnotations.push(locus);
    }
  }

  /**
   * Callback function passed into the annotation tracks to trigger tree
   * building of the spatial RTree.
   *
   * @description
   * Simple counter that call `this.buildTree()` once the number of annotation
   * tracks is reached. This might need to be improved!=
   */
  trackDrawn({ uuid }) {
    if (!this.childTrackUuids[uuid]) return;

    this.numTracksDrawn += 1;
    if (!(this.numTracksDrawn % this.annotationTracks.length)) this.buildTree();
  }

  createInsets() {
    this.drawInsets(this.positionInsets(), this.insetsToBeDrawnIds);
  }

  positionInsets() {
    if (!this.insetsToBeDrawn.length) return [];

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

    const insets = this.insetsToBeDrawn
      .map((inset) => {
        if (!this.insets[inset.uid]) {
          // Add new inset
          this.insets[inset.uid] = {
            t: 1.0,
            x: (inset.maxX + inset.minX) / 2,
            y: (inset.maxY + inset.minY) / 2,
            ox: (inset.maxX + inset.minX) / 2,  // Origin x
            oy: (inset.maxY + inset.minY) / 2,  // Origin y
            width: 64,
            height: 64,
            wh: 32,  // Width half
            hh: 32,  // Heigth half
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

          this.insets[inset.uid].x -= dX;
          this.insets[inset.uid].y -= dY;

          this.insets[inset.uid].t = this.scaleChanged ? 0.5 : 0;
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

      positionLabels
        // Insets, i.e., labels
        .label(insetsToBePositioned)
        // Anchors, i.e., label origins, already positioned labels, and other
        // annotations
        .anchor(anchors)
        .width(this.dimensions[0])
        .height(this.dimensions[1])
        .start(Math.max(2, Math.min(100 / insetsToBePositioned.length)));

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
      inset.cX1,
      inset.cX2,
      inset.cY1,
      inset.cY2
    ]));

    return pos;
  }

  drawInsets(insets, insetIds) {
    Promise.all(this.insetsTrack.drawInsets(insets, insetIds))
      .then(() => { this.animate(); })
      .catch((e) => { this.animate(); console.error(e); });
  }

  updateContents(newContents, trackCreator) {
    const newTracks = [];
    const currentTracks = new Set();

    // go through the new track list and create tracks which we don't
    // already have
    newContents.forEach((nc) => {
      currentTracks.add(nc.uid);

      if (nc.uid in this.createdTracks) {
        newTracks.push(this.createdTracks[nc.uid]);
      } else {
        const newTrack = trackCreator(nc);
        newTrack.setPosition(this.position);
        newTrack.setDimensions(this.dimensions);
        newTracks.push(newTrack);

        newTrack.zoomed(this._xScale, this._yScale);

        this.createdTracks[nc.uid] = newTrack;
      }
    });

    this.annotationTracks = newTracks;

    // remove the ones that were previously, but no longer, present
    const knownTracks = new Set(Object.keys(this.createdTracks));
    const exitTracks = new Set([...knownTracks].filter(x => !currentTracks.has(x)));
    [...exitTracks].forEach((trackUid) => {
      this.createdTracks[trackUid].remove();
      delete this.createdTracks[trackUid];
    });

    return this;
  }

  /**
   * Setting the position of this track simply means setting the positions
   * of its children.
   */
  setPosition(newPosition) {
    this.position = newPosition;
    this.childTracks.forEach(
      childTracks => childTracks.setPosition(newPosition)
    );
  }

  setDimensions(newDimensions) {
    this.dimensions = newDimensions;
    this.childTracks.forEach(
      childTracks => childTracks.setDimensions(newDimensions)
    );
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
    this.drawnAnnoIdxOld = this.drawnAnnoIdx;
    this.drawnAnnoIdx = new Set();
    this.numTracksDrawn = 0;
    this.newAnno = false;
  }

  zoomed(newXScale, newYScale, k, x, y, xPositionOffset, yPositionOffset) {
    this.initTree();
    this.scaleChanged = this.currK !== k;

    this._xScale = newXScale;
    this._yScale = newYScale;
    this.currK = k;

    this.childTracks.forEach(
      childTracks => childTracks.zoomed(
        newXScale, newYScale, k, x, y, xPositionOffset, yPositionOffset
      )
    );
  }

  refScalesChanged(refXScale, refYScale) {
    this.childTracks.forEach(
      childTracks => childTracks.refScalesChanged(refXScale, refYScale)
    );
  }

  /**
   * Rerenderer, which does nothing.
   *
   * @description
   * This methid is required as it's called by the track renderer
   */
  rerender() { /* Nothing */ }

  exportSVG() {
    const svg = document.createElement('g');

    this.childTracks
      .filter(childTrack => childTrack.exportSVG)
      .forEach((childTracks) => {
        svg.appendChild(childTracks.exportSVG()[0]);
      });

    return [svg, svg];
  }
}

export default Combined2dAnnotationsTrack;
