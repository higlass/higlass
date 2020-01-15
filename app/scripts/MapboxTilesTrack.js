import OSMTilesTrack from './OSMTilesTrack';

/**
 * A track that must pull remote tiles
 */
class MapboxTilesTrack extends OSMTilesTrack {
  /**
   * @param scene: A PIXI.js scene to draw everything to.
   * @param server: The server to pull tiles from.
   * @param tilesetUid: The data set to get the tiles from the server
   */
  constructor(context, options) {
    super(context, options);

    // Force Mapbox and OpenStreetMaps copyright
    this.style = options.style;

    if (!this.options.accessToken) {
      this.errorTextText =
        "No access token provided in the viewconf's track options " +
        "('accessToken' option).";
      this.drawError();
    }
  }

  rerender(newOptions) {
    super.rerender(newOptions);

    if (newOptions.style === this.style) return;

    this.style = newOptions.style;

    this.removeAllTiles();
    this.refreshTiles();
  }

  /**
   * Get the url used to fetch the tile data
   */
  getTileUrl(tileZxy) {
    const mapStyle =
      this.options && this.options.style ? this.options.style : 'streets-v10';

    const tileSize =
      this.options && +this.options.tileSize ? +this.options.tileSize : 256;

    return `https://api.mapbox.com/styles/v1/mapbox/${mapStyle}/tiles/${tileSize}/${tileZxy[0]}/${tileZxy[1]}/${tileZxy[2]}?access_token=${this.options.accessToken}`;
  }
}

export default MapboxTilesTrack;
