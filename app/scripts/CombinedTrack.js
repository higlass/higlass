// @ts-nocheck
import slugid from 'slugid';

class CombinedTrack {
  constructor(context) {
    this.context = context;
    const { tracks, createTrackObject } = context;

    this.childTracks = tracks.map(createTrackObject);
    this.createdTracks = {};
    this.uid = slugid.nice();

    this.childTracks.forEach((ct, i) => {
      this.createdTracks[tracks[i].uid] = ct;
    });

    for (let i = 0; i < this.childTracks.length; i++) {
      if (!this.childTracks[i]) {
        console.error('Empty child track in CombinedTrack:', this);
      }
    }
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

    this.childTracks = newTracks;

    // remove the ones that were previously, but no longer, present
    const knownTracks = new Set(Object.keys(this.createdTracks));
    const exitTracks = new Set(
      [...knownTracks].filter((x) => !currentTracks.has(x)),
    );
    [...exitTracks].forEach((trackUid) => {
      this.createdTracks[trackUid].remove();
      delete this.createdTracks[trackUid];
    });

    return this;
  }

  setPosition(newPosition) {
    /**
     * Setting the position of this track simply means setting the positions
     * of its children.
     */
    this.position = newPosition;

    for (let i = 0; i < this.childTracks.length; i++) {
      this.childTracks[i].setPosition(newPosition);
    }
  }

  setDimensions(newDimensions) {
    this.dimensions = newDimensions;

    for (let i = 0; i < this.childTracks.length; i++) {
      this.childTracks[i].setDimensions(newDimensions);
    }
  }

  zoomed(newXScale, newYScale, k, x, y, xPositionOffset, yPositionOffset) {
    this._xScale = newXScale;
    this._yScale = newYScale;

    for (let i = 0; i < this.childTracks.length; i++) {
      // console.log('childTracks.zoomed', this.childTracks[i].zoomed);
      this.childTracks[i].zoomed(
        newXScale,
        newYScale,
        k,
        x,
        y,
        xPositionOffset,
        yPositionOffset,
      );
    }
  }

  // refXScale(xScale) {
  //   for (let i = 0; i < this.childTracks.length; i++) {
  //     this.childTracks[i].refXScale(xScale);
  //   }
  // }

  // refYScale(yScale) {
  //   for (let i = 0; i < this.childTracks.length; i++) {
  //     this.childTracks[i].refYScale(yScale);
  //   }
  // }

  clickOutside() {
    for (let i = 0; i < this.childTracks.length; i++) {
      this.childTracks[i].clickOutside();
    }
  }

  click(...args) {
    for (let i = 0; i < this.childTracks.length; i++) {
      this.childTracks[i].click(...args);
    }
  }

  draw() {
    // for (let i = 0; i < this.childTracks.length; i++) {
    //   this.childTracks[i].draw();
    // }
  }

  // xScale(xScale) {
  //   this._xScale = xScale;

  //   for (let i = 0; i < this.childTracks.length; i++) {
  //     this.childTracks[i].xScale(xScale);
  //   }
  // }

  // yScale(xScale) {
  //   this._yScale = yScale;

  //   for (let i = 0; i < this.childTracks.length; i++) {
  //     this.childTracks[i].yScale(yScale);
  //   }
  // }

  refScalesChanged(refXScale, refYScale) {
    for (let i = 0; i < this.childTracks.length; i++) {
      this.childTracks[i].refScalesChanged(refXScale, refYScale);
    }
  }

  remove() {
    for (let i = 0; i < this.childTracks.length; i++) {
      this.childTracks[i].remove();
    }
  }

  exportSVG() {
    const svg = document.createElement('g');

    for (const childTrack of this.childTracks) {
      if (childTrack.exportSVG) {
        // exportSVG returns a tuple containing the base element
        // and the element onto which to draw extra features
        // in our case, we only need the complete svg
        svg.appendChild(childTrack.exportSVG()[0]);
      }
    }

    return [svg, svg];
  }

  rerender(options) {
    // console.log('COMBINED TRACK rerender...');
  }

  minValue(_) {
    if (arguments.length === 0) {
      const minValues = this.childTracks
        .filter((x) => x.minValue) // filter for tracks which have the minValue function
        .map((x) => x.minValue()) // get the minValue for each track
        .filter((x) => x); // filter out undefineds

      return Math.min(...minValues);
    }
    for (const childTrack of this.childTracks) {
      if (childTrack.minValue) {
        childTrack.minValue(_);
      }
    }
    return undefined;
  }

  maxValue(_) {
    if (arguments.length === 0) {
      const maxValues = this.childTracks
        .filter((x) => x.maxValue) // filter for tracks which have the minValue function
        .map((x) => x.maxValue()) // get the minValue for each track
        .filter((x) => x); // filter out undefineds

      return Math.max(...maxValues);
    }
    for (const childTrack of this.childTracks) {
      if (childTrack.maxValue) {
        childTrack.maxValue(_);
      }
    }
    return undefined;
  }

  respondsToPosition(x, y) {
    return (
      x >= this.position[0] &&
      x <= this.dimensions[0] + this.position[0] &&
      y >= this.position[1] &&
      y <= this.dimensions[1] + this.position[1]
    );
  }

  stopHover() {
    for (const childTrack of this.childTracks) {
      if (childTrack.stopHover) childTrack.stopHover();
    }
  }

  getMouseOverHtml(trackX, trackY) {
    let mouseOverHtml = '';

    for (const childTrack of this.childTracks) {
      if (childTrack.getMouseOverHtml) {
        const trackHtml = childTrack.getMouseOverHtml(trackX, trackY);

        if (trackHtml && trackHtml.length) {
          mouseOverHtml += trackHtml;
          mouseOverHtml += '<br/>';
        }
      }
    }

    return mouseOverHtml;
  }
}

export default CombinedTrack;
