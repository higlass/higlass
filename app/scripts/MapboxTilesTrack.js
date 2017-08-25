import {OSMTilesTrack} from './OSMTilesTrack.js';

export class MapboxTilesTrack extends OSMTilesTrack {
    /**
     * A track that must pull remote tiles
     */
    constructor(scene, options, animate) {
        /**
         * @param scene: A PIXI.js scene to draw everything to.
         * @param server: The server to pull tiles from.
         * @param tilesetUid: The data set to get the tiles from the server
         */
        super(scene, options, animate);

        this.currentStyle = options.mapboxStyle;
    }

    rerender(newOptions) {
        super.rerender(newOptions);

        if (newOptions.mapboxStyle == this.currentStyle)
            return;

        this.currentStyle = newOptions.mapboxStyle;

        this.removeAllTiles();
        this.refreshTiles();
    }

    getTileUrl(tileZxy) {
        /**
         * Get the url used to fetch the tile data
         */
        let mapStyle = 'mapbox.streets';

        if (this.options && this.options.mapboxStyle) {
            mapStyle = this.options.mapboxStyle;
        }

        let accessToken = "pk.eyJ1IjoicGtlcnBlZGppZXYiLCJhIjoiY2o1OW44dnN0MGFqZDMxcXFoYW04cmh4biJ9.WGEDSUhcn4W4x7IaA8DFRw";
        let src = "http://api.tiles.mapbox.com/v4/" + mapStyle + "/" + tileZxy[0] + "/" + tileZxy[1] + "/" + tileZxy[2] + ".png?access_token=" + accessToken;

        return src;
    }

}

export default MapboxTilesTrack;
