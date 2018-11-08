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
  constructor(pubSub, scene, options, animate, accessToken) {
    super(pubSub, scene, options, animate);

    // Force Mapbox and OpenStreetMaps copyright
    this.options.name = `© Mapbox © OpenStreetMap${options.name ? `\n${options.name}` : ''}`;

    this.style = options.style;

    if (!this.options.accessToken) {
      this.errorTextText = "No access token provided in the viewconf options ('accessToken' option)."
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

  getTileUrl(tileZxy) {
    /**
         * Get the url used to fetch the tile data
         */
    let mapStyle = 'mapbox.streets';

    if (this.options && this.options.style) {
      mapStyle = this.options.style;
    }

    const src = `http://api.tiles.mapbox.com/v4/${mapStyle}/${tileZxy[0]}/${tileZxy[1]}/${tileZxy[2]}.png?access_token=${this.options.accessToken}`;

    return src;
  }
}

export default MapboxTilesTrack;
