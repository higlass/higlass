export class CombinedTrack {
    constructor(childTracks) {
        this.childTracks = childTracks;

        for (let i = 0; i < this.childTracks.length; i++) {
            if (!this.childTracks[i]) {
                console.log('ERROR: empty child track in CombinedTrack:', this);
            }
        }
    }

    setPosition(newPosition) {
        /**
         * Setting the position of this track simply means setting the positions
         * of its children.
         */
        for (let i = 0; i < this.childTracks.length; i++) {
            this.childTracks[i].setPosition(newPosition);
        }
    }

    setDimensions(newDimensions) {
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
        console.log('childTracks:', this.childTracks);
        for (let i = 0; i < this.childTracks.length; i++) {
            this.childTracks[i].refScalesChanged(refXScale, refYScale);
        }
        
    }

    remove() {
        for (let i = 0; i < this.childTracks.length; i++) {
            this.childTracks[i].remove();
        }
    }
}
