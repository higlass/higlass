class OneDTiledArea {
    constructor(baseUrl, width, tilesChangedCallback) {
        this.baseUrl =  baseUrl;  // the base url for the tileset
        this.currentlyVisible = [];    // the currently visible tiles
        this.tilesChangedCallback = tilesChangedCallback; // the function to call when the currently visible
                                                          // tiles have changed
        this.width = width;
        this.tileset_info = null;

        this.xScale = d3.scale.linear().range([0, width]);
        this.zoomedXScale = xScale.copy();

        d3.json(this.baseUrl + '/tileset_info', function(error, tile_info) {
            this.tileset_info = tile_info;

            this.xScale.domain([tile_info.min_pos[0], tile_info.max_pos[0]]);
        });
    }


    zoomChanged(translate, scale) {
        // the zoom level changed, so we have to recalculate which tiles are visible
        this.zoomedXScale.domain(this.xScale.range()
                .map(function(x) { return (x - translate[0]) / scale })
                .map(xScale.invert));
                                    
        let zoomScale = Math.max((this.tileset_info.min_pos[0] - this.tileset_info.max_pos[0]) / 
                                 (zoomedXScale.domain()[1] - zoomedXScale.domain()[0]), 1);
        let addedZoom = Math.ceil(Math.log(width / 256) / Math.LN2);
        let zoomLevel = Math.round(Math.log(zoomScale) / Math.LN2) + addedZoom;
    }

}
