import rbush from 'rbush';

// Components
import Insets2dTrack from './Insets2dTrack';

// Utils
import { colorToHex, findNearest2dPoint } from './utils';

class Combined2dAnnotationsTrack {
  constructor(scene, trackDefs, options, trackCreator, animate) {
    this.annotationTracks = trackDefs.map((trackDef) => {
      const track = trackCreator(trackDef);

      // Augment track options
      track.drawn = this.trackDrawn.bind(this);
      track.annotationDrawn = this.annotationDrawn.bind(this);

      return track;
    });

    if (this.annotationTracks.some(childTrack => !childTrack)) {
      console.error('Empty child track in Combined2dAnnotationsTrack:', this);
    }

    this.animate = animate;

    this.insetsTrack = new Insets2dTrack(scene, {
      server: options.server,
      chromInfoPath: options.chromInfoPath,
      heatmapUuid: options.heatmapUuid,
      fill: colorToHex(options.insetFill || 'black'),
      fillOpacity: +options.insetFillOpacity || 0.5,
      strokeWidth: +options.insetStrokeWidth || 1,
      stroke: colorToHex(options.insetStroke || 'black'),
      strokeOpacity: +options.insetStrokeOpacity || 1,
      leaderLineStrokeWidth: +options.insetLeaderLineStrokeWidth || 1,
      leaderLineStroke: colorToHex(options.insetLeaderLineStroke || 'black'),
      leaderLineStrokeOpacity: +options.insetLeaderLineStrokeOpacity || 1,
      dropDistance: +options.insetDropDistance || 3,
      dropBlur: +options.insetDropBlur || 3,
      dropOpacity: +options.insetDropOpacity || 1,
      opacity: +options.opacity || 1
    });

    this.childTracks = [...this.annotationTracks, this.insetsTrack];

    this.options = options;

    this.initTree();
  }

  buildTree() {
    // console.log('build tree', this.drawnAnnotations.length);
    this.tree.load(this.drawnAnnotations);
    // console.log(this.ass);
    this.createInsets();
  }

  annotationDrawn(x, y, w, h, cX1, cX2, cY1, cY2) {
    const locus = {
      minX: x,
      minY: y,
      maxX: x + w,
      maxY: y + h,
      cX1,
      cX2,
      cY1,
      cY2
    };

    this.drawnAnnotations.push(locus);

    if (
      w <= this.options.insetThreshold ||
      h <= this.options.insetThreshold
    ) {
      this.insetsToBeDrawn.push(locus);
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
  trackDrawn() {
    this.numTracksDrawn += 1;
    if (this.numTracksDrawn === this.annotationTracks.length) this.buildTree();
  }

  createInsets() {
    this.insetsTrack.init();
    this.drawInsets(this.positionInsets());
  }

  positionInsets() {
    return this.insetsToBeDrawn.map((inset) => {
      const collisions = this.tree.search(inset);
      let distX = -1;
      let distY = -1;
      let minX = -1;
      let minXmaxY = -1;
      let maxY = -1;
      let maxYminX = -1;
      let distXCollisionIdx = -1;
      let fromSameCollision = true;

      collisions.forEach((collision, index) => {
        const _distX = inset.minX - collision.minX;
        const _distY = collision.maxY - inset.maxY;

        if (_distX > distX) {
          distX = _distX;
          distXCollisionIdx = index;
          minX = collision.minX;
          minXmaxY = collision.maxY;
          fromSameCollision = false;
        }

        if (_distY >= distY) {
          distY = _distY;
          maxY = collision.maxY;
          maxYminX = collision.minX;
          fromSameCollision = distXCollisionIdx === index;
        }
      });

      let interX = -1;
      let interY = -1;

      if (!fromSameCollision) {
        interX = maxYminX;
        interY = minXmaxY;
      }

      const targets = [
        [minX, inset.maxY],
        [inset.minX, maxY],
        [interX, interY],
      ];

      const closest = findNearest2dPoint([inset.minX, inset.maxY], targets);

      return [
        ...closest,
        inset.minX,
        inset.maxY,
        inset.cX1,
        inset.cX2,
        inset.cY1,
        inset.cY2
      ];
    });
  }

  drawInsets(insets) {
    insets.forEach(
      inset => this.insetsTrack
        .drawInset(
          inset[0],
          inset[1],
          64,
          64,
          inset[2],
          inset[3],
          inset[4],
          inset[5],
          inset[6],
          inset[7],
        )
    );
    this.animate();
  }

  updateContents(newContents, trackCreator) {
    const newTracks = [];
    const currentTracks = new Set();

    // go through the new track list and create tracks which we don't
    // already have
    newContents.forEach((nc) => {
      currentTracks.add(nc.uid);

      if (nc.uid in this.createdTracks) { newTracks.push(this.createdTracks[nc.uid]); } else {
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
    this.drawnAnnotations = [];
    this.insetsToBeDrawn = [];
    this.numTracksDrawn = 0;
  }

  zoomed(newXScale, newYScale, k, x, y, xPositionOffset, yPositionOffset) {
    this.initTree();

    this._xScale = newXScale;
    this._yScale = newYScale;

    this.childTracks.forEach(
      childTracks => childTracks.zoomed(
        newXScale, newYScale, k, x, y, xPositionOffset, yPositionOffset
      )
    );
  }

  draw() {
    // this.childTracks.forEach(childTracks => childTracks.draw());
  }

  refScalesChanged(refXScale, refYScale) {
    this.childTracks.forEach(
      childTracks => childTracks.refScalesChanged(refXScale, refYScale)
    );
  }

  remove() {
    this.childTracks.forEach(childTracks => childTracks.remove());
  }

  rerender() {
    // Nothing
  }

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
