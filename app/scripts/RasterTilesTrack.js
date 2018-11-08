import OSMTilesTrack from './OSMTilesTrack';

/**
 * A track that must pull remote tiles
 */
class RasterTilesTrack extends OSMTilesTrack {
  /**
   * @param scene: A PIXI.js scene to draw everything to.
   * @param server: The server to pull tiles from.
   * @param tilesetUid: The data set to get the tiles from the server
   */
  constructor(pubSub, scene, options, animate, accessToken) {
    // Force Mapbox and OpenStreetMaps copyright
    // options.name = `© Mapbox © OpenStreetMap${options.name ? `\n${options.name}` : ''}`;
    super(pubSub, scene, options, animate);

    this.style = options.style;

    if (!this.options.tileSource) {
        this.errorTextText = "No tile source string provided in the options. It should be in the form of http://a.com/{z}/{x}/{y}"

        this.drawError();
    }
  }


  getTileUrl(tileZxy) {
    /**
         * Get the url used to fetch the tile data
         */
    let newUrl = this.options.tileSource.replace('{z}', tileZxy[0]);
    newUrl = newUrl.replace('{x}', tileZxy[1]);
    newUrl = newUrl.replace('{y}', tileZxy[2]);

    return newUrl;
  }
}

export default RasterTilesTrack;
