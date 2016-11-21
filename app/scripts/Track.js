export class Track {
    constructor(xScale, yScale, dims) {
        /**
         * @param xScale: A scale for placing points (can be null if this is vertical track)
         * @param yScale: A scale for placing graphics (can be null if this is a horizontal track)
         */

        this.translate = [0,0];
        this.scale = 1;

        this.xScale = xScale;
        this.yScale = yScale;

        if (xScale)
            this.zoomedXScale = xScale.copy();
        else
            this.zoomedXScale = null;

        if (yScale)
            this.zoomedYScale = yScale.copy();
        else
            this.zoomedXScale = null;

        this.width = dims[0];
        this.height = dims[1];

    }

    sizeChanged(newDims) {
        this.height = newDims[0];
        this.width = newDims[1];
    }

    xScaleChanged(xScale) {
        this.xScale = xScale;
        this.zoomedXScale.range(xScale.range())
    }

    yScaleChanged(yScale) {
        this.yScale = yScale;
        this.zoomedYScale.range(yScale.range())
    }

    zoomChanged(scale, translate) {
        if (this.xScale) {
            zoomedXScale.domain(xScale.range()
                                      .map(function(x) { return (x - translate[0]) / scale })
                                      .map(xScale.invert))
        }

        if (this.yScale) {
            zoomedYScale.domain(yScale.range()
                                  .map(function(x) { return (x - translate[1]) / scale })
                                  .map(yScale.invert))
        }
    }

    resize(width, height) {
        this.width = width;
        this.height = height;

        // maybe redo the scales
    }

    drawTiles(tiles) {
        /**
         * Draw this track.
         * 
         * This function should be overriden in derived classes
         */
    }
}
