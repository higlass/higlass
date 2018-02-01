import TiledPixiTrack from './TiledPixiTrack';

// Services
import { tileProxy } from './services';
import { create } from './services/pub-sub';

// Utils
import { colorToHex } from './utils';

class Annotations2dTrack extends TiledPixiTrack {
  constructor(scene, dataConfig, handleTilesetInfoReceived, option, animate) {
    super(scene, dataConfig, handleTilesetInfoReceived, option, animate);

    this.drawnAnnotations = {};

    this.options.minSquareSize = +this.options.minSquareSize;

    const { publish, subscribe, unsubscribe } = create({});
    this.publish = publish;
    this.subscribe = subscribe;
    this.unsubscribe = unsubscribe;
  }

  /* --------------------------- Getter / Setter ---------------------------- */

  get minX() {
    return this.tilesetInfo && this.tilesetInfo.min_x
      ? this.tilesetInfo.min_x
      : 0;
  }

  get maxX() {
    return this.tilesetInfo && this.tilesetInfo.max_x
      ? this.tilesetInfo.max_x
      : this.tilesetInfo.max_width || this.tilesetInfo.max_size;
  }

  get minY() {
    // Currently HiGlass only supports squared tile sets
    return this.minX;
  }

  get maxY() {
    // Currently HiGlass only supports squared tile sets
    return this.maxX;
  }

  get maxSize() {
    const maxSize = this.tilesetInfo.max_x && Math.max(
      this.tilesetInfo.max_x - this.tilesetInfo.min_x,
      this.tilesetInfo.max_y - this.tilesetInfo.min_y
    );

    if (maxSize) return maxSize;

    if (this.tilesetInfo.max_size) return this.tilesetInfo.max_size;

    return 0;
  }

  /**
   * Point projection from the data to the view (pixel) coordinates
   * @param   {number}  x  Data X coordinate
   * @param   {number}  y  Data Y coordinate
   * @return  {array}  Tuple [x,y] containing the translated view coordinates.
   */
  projection([x, y]) {
    return [this._xScale(x), this._yScale(y)];
  }

  /**
   * The local tile identifier
   *
   * @param  {Array}  tile  Array containing [zoomLevel, xPos, yPos]
   * @return  {String}  Joined ID string
   */
  tileToLocalId(tile) {
    // tile contains [zoomLevel, xPos, yPos]
    return `${tile.join('.')}`;
  }

  /**
   * The tile identifier used on the server
   *
   * @param  {Array}  tile  Array containing [zoomLevel, xPos, yPos]
   * @return  {String}  Joined ID string
   */
  tileToRemoteId(tile) {
    return `${tile.join('.')}`;
  }

  localToRemoteId(remoteId) {
    const idParts = remoteId.split('.');
    return idParts.slice(0, idParts.length - 1).join('.');
  }

  calculateZoomLevel() {
    const xZoomLevel = tileProxy.calculateZoomLevel(
      this._xScale, this.minX, this.maxX
    );
    const yZoomLevel = tileProxy.calculateZoomLevel(
      this._yScale, this.minY, this.maxY
    );

    return Math.min(Math.max(xZoomLevel, yZoomLevel), this.maxZoom);
  }

  /**
   * Set which tiles are visible right now.
   *
   * @param tiles: A set of tiles which will be considered the currently visible
   * tile positions.
   */
  setVisibleTiles(tilePositions) {
    this.visibleTiles = tilePositions.map(x => ({
      tileId: this.tileToLocalId(x),
      remoteId: this.tileToRemoteId(x),
    }));

    this.visibleTileIds = new Set(this.visibleTiles.map(x => x.tileId));
  }

  calculateVisibleTiles() {
    // if we don't know anything about this dataset, no point
    // in trying to get tiles
    if (!this.tilesetInfo) return;

    this.zoomLevel = this.calculateZoomLevel();

    this.xTiles = tileProxy.calculateTiles(
      this.zoomLevel,
      this._xScale,
      this.minX,
      this.maxX,
      this.tilesetInfo.max_zoom,
      this.maxSize
    );

    this.yTiles = tileProxy.calculateTiles(
      this.zoomLevel,
      this._yScale,
      this.minY,
      this.maxY,
      this.tilesetInfo.max_zoom,
      this.maxSize
    );

    const zoomLevel = this.zoomLevel;

    // if we're mirroring tiles, then we only need tiles along the diagonal
    const tiles = [];

    // calculate the ids of the tiles that should be visible
    for (let i = 0; i < this.xTiles.length; i++) {
      for (let j = 0; j < this.yTiles.length; j++) {
        tiles.push([zoomLevel, this.xTiles[i], this.yTiles[j]]);
      }
    }

    this.setVisibleTiles(tiles);
  }

  draw() {
    this.drawnAnnotations = {};

    super.draw();
  }

  drawTile(tile) {
    if (!tile.graphics) return;

    const graphics = tile.graphics;
    graphics.clear();

    this.setBorderStyle(graphics);
    this.setFill(graphics);

    graphics.alpha = this.options.rectangleDomainOpacity || 0.5;

    if (!tile.tileData.length) return;

    tile.tileData
      .filter(td => !(td.uid in this.drawnAnnotations))
      .forEach((td) => {
        const [startX, startY] = this.projection([td.xStart, td.yStart]);
        const [endX, endY] = this.projection([td.xEnd, td.yEnd]);

        this.drawAnnotation(
          this.prepAnnotation(
            graphics, td.uid, startX, startY, endX - startX, endY - startY, td
          )
        );
      });
  }

  prepAnnotation(graphics, uid, startX, startY, width, height, td) {
    return {
      graphics,
      uid,
      annotation: { x: startX, y: startY, width, height },
      dataPos: [td.xStart, td.xEnd, td.yStart, td.yEnd]
    };
  }

  drawAnnotation({ graphics, uid, annotation, dataPos }) {
    if (this.options.minSquareSize) {
      if (
        annotation.width < this.options.minSquareSize
        || annotation.height < this.options.minSquareSize
      ) {
        annotation.x = (annotation.x + annotation.width) / 2;
        annotation.y = (annotation.y + annotation.height) / 2;
        annotation.width = this.options.minSquareSize;
        annotation.height = this.options.minSquareSize;
      }
    }

    this.drawnAnnotations[uid] = annotation;

    const viewPos = [
      annotation.x, annotation.y, annotation.width, annotation.height
    ];

    graphics.drawRect(...viewPos);

    this.publish('annotationDrawn', { uid, viewPos, dataPos });
  }

  exportSVG() {
    let track = null;
    let base = null;

    if (super.exportSVG) {
      [base, track] = super.exportSVG();
    } else {
      base = document.createElement('g');
      track = base;
    }

    const output = document.createElement('g');
    output.setAttribute(
      'transform',
      `translate(${this.position[0]},${this.position[1]})`
    );

    track.appendChild(output);

    this.visibleAndFetchedTiles()
      .filter(tile => tile.tileData && tile.tileData.length)
      .map(tile => ({ graphics: tile.graphics, td: tile.tileData }))
      .forEach(({ td, graphics }) => {
        const gTile = document.createElement('g');

        gTile.setAttribute(
          'transform',
          `translate(${graphics.position.x},${graphics.position.y})scale(${graphics.scale.x},${graphics.scale.y})`
        );
        output.appendChild(gTile);

        if (td.uid in this.drawnAnnotations) {
          const rect = this.drawnAnnotations[td.uid];
          const r = document.createElement('rect');

          r.setAttribute('x', rect.x);
          r.setAttribute('y', rect.y);
          r.setAttribute('width', rect.width);
          r.setAttribute('height', rect.height);

          r.setAttribute('fill', this.options.fillColor || 'grey');
          r.setAttribute('opacity', 0.3);

          r.style.stroke = this.options.fillColor || 'grey';
          r.style.strokeWidth = '1px';

          gTile.appendChild(r);
        }
      });

    return [base, base];
  }

  setBorderStyle(
    graphics,
    color = this.options.rectangleDomainStrokeColor,
    width = this.options.rectangleDomainStrokeWidth,
    alpha = this.options.rectangleDomainStrokeOpacity
  ) {
    graphics.lineStyle(
      typeof width !== 'undefined' ? width : 1,
      colorToHex(color || 'black'),
      typeof alpha !== 'undefined' ? alpha : 1,
    );
  }

  setFill(
    graphics,
    color = this.options.rectangleDomainFillColor,
    alpha = this.options.rectangleDomainFillOpacity
  ) {
    graphics.beginFill(
      colorToHex(color || 'grey'),
      typeof alpha !== 'undefined' ? alpha : 0.4,
    );
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    this.pMain.position.y = this.position[1];
    this.pMain.position.x = this.position[0];
  }

  zoomed(newXScale, newYScale) {
    this.xScale(newXScale);
    this.yScale(newYScale);

    this.refreshTiles();
    this.draw();
  }
}

export default Annotations2dTrack;
