export class CombinedTrack {
    constructor(childTracks) {
        this.childTracks = childTracks;
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


    zoomed(newXScale, newYScale) {
        for (let i = 0; i < this.childTracks.length; i++) {
            this.childTracks[i].zoomed(newXScale, newYScale);
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
}
