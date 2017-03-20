export class CombinedTrack {
    constructor(trackDefs, trackCreator) {
        this.childTracks = trackDefs.map(trackCreator);
        this.createdTracks = {};

        this.childTracks.forEach((ct,i) => {
            this.createdTracks[trackDefs[i].uid] = ct;
        });

        for (let i = 0; i < this.childTracks.length; i++) {
            if (!this.childTracks[i]) {
                console.error('Empty child track in CombinedTrack:', this);
            }
        }
    }

    updateContents(newContents, trackCreator) {
        let newTracks = [];
        let currentTracks = new Set();

        // go through the new track list and create tracks which we don't
        // already have
        newContents.forEach(nc => {
            currentTracks.add(nc.uid);

            if (nc.uid in this.createdTracks)
                newTracks.push(this.createdTracks[nc.uid]);
            else {
                let newTrack = trackCreator(nc);
                newTracks.push(newTrack);
                this.createdTracks[nc.uid] = newTrack;
            }
        });

        this.childTracks = newTracks;

        // remove the ones that were previously, but no longer, present
        let knownTracks = new Set(Object.keys(this.createdTracks));
        let exitTracks = new Set([...knownTracks].filter(x => !currentTracks.has(x)));
        [...exitTracks].forEach(trackUid => {
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
        for (let i = 0; i < this.childTracks.length; i++) {
            this.childTracks[i].zoomed(newXScale, newYScale, k, x, y,
                                       xPositionOffset, yPositionOffset);
        }

    }

    refXScale(xScale)  {
        for (let i = 0; i < this.childTracks.length; i++) {
            this.childTracks[i].refXScale(xScale);
        }
    }

    refYScale(yScale)  {
        for (let i = 0; i < this.childTracks.length; i++) {
            this.childTracks[i].refYScale(yScale);
        }
    }

    draw()  {
        for (let i = 0; i < this.childTracks.length; i++) {
            this.childTracks[i].draw();
        }
    }

    xScale(xScale)  {
        for (let i = 0; i < this.childTracks.length; i++) {
            this.childTracks[i].xScale(xScale);
        }
    }

    yScale(xScale)  {
        for (let i = 0; i < this.childTracks.length; i++) {
            this.childTracks[i].yScale(yScale);
        }
    }

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

    rerender(options) {
        //console.log('COMBINED TRACK rerender...');
    }
}
