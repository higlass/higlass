import createPubSub from 'pub-sub-es';

import TiledPixiTrack from './TiledPixiTrack';

// Configs
import { GLOBALS } from './configs';

// Services
import { tileProxy } from './services';

// Utils
import { colorToHex, max, min } from './utils';

const MOUSE_CLICK_TIME = 250;

class Annotations2dTrack extends TiledPixiTrack {
  constructor(context, options) {
    super(context, options);
    const { pubSub } = context;

    this.drawnAnnotations = {};
    this.drawnAnnoGfx = {};

    this.selectedAnno = null;

    this.options.minSquareSize = +this.options.minSquareSize;

    const { publish, subscribe, unsubscribe } = createPubSub();
    this.publish = publish;
    this.subscribe = subscribe;
    this.unsubscribe = unsubscribe;

    this.sT = 0;

    this.annoSelectedBound = this.annoSelected.bind(this);

    this.pubSubs.push(pubSub.subscribe('annoSelected', this.annoSelectedBound));
  }

  /* --------------------------- Getter / Setter ---------------------------- */

  get minX() {
    return this.tilesetInfo && this.tilesetInfo.min_pos
      ? this.tilesetInfo.min_pos[0]
      : 0;
  }

  get maxX() {
    return this.tilesetInfo && this.tilesetInfo.max_pos
      ? this.tilesetInfo.max_pos[0]
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
    const maxSize =
      this.tilesetInfo.max_pos &&
      Math.max(
        this.tilesetInfo.max_pos[0] - this.tilesetInfo.min_pos[0],
        this.tilesetInfo.max_pos[1] - this.tilesetInfo.min_pos[1],
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
      this._xScale,
      this.minX,
      this.maxX,
    );
    const yZoomLevel = tileProxy.calculateZoomLevel(
      this._yScale,
      this.minY,
      this.maxY,
    );

    return min(max(xZoomLevel, yZoomLevel), this.maxZoom);
  }

  /**
   * Set which tiles are visible right now.
   *
   * @param tiles: A set of tiles which will be considered the currently visible
   * tile positions.
   */
  setVisibleTiles(tilePositions) {
    this.visibleTiles = tilePositions.map((x) => ({
      tileId: this.tileToLocalId(x),
      remoteId: this.tileToRemoteId(x),
    }));

    this.visibleTileIds = new Set(this.visibleTiles.map((x) => x.tileId));
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
      this.maxSize,
    );

    this.yTiles = tileProxy.calculateTiles(
      this.zoomLevel,
      this._yScale,
      this.minY,
      this.maxY,
      this.tilesetInfo.max_zoom,
      this.maxSize,
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

  drawTile(tile, force = false, silent = false) {
    if (!tile.graphics) return;

    tile.graphics.__tile__ = tile;

    const graphics = tile.graphics;
    graphics.clear();

    this.setBorderStyle(graphics);
    this.setFill(graphics);

    graphics.alpha = +this.options.rectangleDomainOpacity;

    if (!tile.tileData.length) return;

    tile.tileData
      .filter((td) => !(td.uid in this.drawnAnnotations) || force)
      .forEach((td) => {
        const [startX, startY] = this.projection([td.xStart, td.yStart]);
        const [endX, endY] = this.projection([td.xEnd, td.yEnd]);

        if (this.options.exclude && this.options.exclude.indexOf(td.uid) >= 0) {
          return;
        }

        this.drawAnnotation(
          this.prepAnnotation(
            graphics,
            td.uid,
            startX,
            startY,
            endX - startX,
            endY - startY,
            td,
          ),
          silent,
        );
      });
  }

  prepAnnotation(graphics, uid, startX, startY, width, height, td) {
    let info;

    try {
      info = JSON.parse(td.fields);
    } catch (e) {
      // Nothing
    }

    return {
      graphics,
      id: td.id,
      uid,
      annotation: {
        x: startX,
        y: startY,
        width,
        height,
      },
      dataPos: [td.xStart, td.xEnd, td.yStart, td.yEnd],
      importance: td.importance,
      info,
    };
  }

  drawAnnotation(
    { graphics, id, uid, annotation, dataPos, importance, info },
    silent,
  ) {
    if (this.options.minSquareSize) {
      if (
        annotation.width < this.options.minSquareSize ||
        annotation.height < this.options.minSquareSize
      ) {
        annotation.x = (annotation.x + annotation.width) / 2;
        annotation.y = (annotation.y + annotation.height) / 2;
        annotation.width = this.options.minSquareSize;
        annotation.height = this.options.minSquareSize;
      }
    }

    this.drawnAnnotations[uid] = annotation;

    const viewPos = [
      annotation.x,
      annotation.y,
      annotation.width,
      annotation.height,
    ];

    let rectGfx = this.drawnAnnoGfx[uid];
    if (!rectGfx) {
      rectGfx = new GLOBALS.PIXI.Graphics();
      this.drawnAnnoGfx[uid] = rectGfx;
    }

    if (graphics.children.indexOf(rectGfx) === -1) {
      graphics.addChild(rectGfx);
    }

    this._drawRect(rectGfx, viewPos, uid);

    graphics.interactive = true;
    rectGfx.interactive = true;
    rectGfx.buttonMode = true;

    const payload = {
      id,
      uid,
      dataPos,
      importance,
      info,
      viewPos: [
        annotation.x,
        annotation.y,
        // To have the same format as `dataPos`, i.e.:
        // a quadruple of [x0, y0, x1, y1]
        annotation.x + annotation.width,
        annotation.y + annotation.height,
      ],
    };

    rectGfx.mouseover = () => this.hover(rectGfx, viewPos, uid);
    rectGfx.mouseout = () => this.blur(rectGfx, viewPos, uid);

    rectGfx.mousedown = () => this.mouseDown();
    rectGfx.mouseup = (event) =>
      this.mouseUp(rectGfx, viewPos, uid, event, payload);

    if (!silent) {
      this.publish('annotationDrawn', {
        trackUuids: this.uuid,
        annotationUuid: uid,
        annotationId: id,
        viewPos,
        dataPos,
        importance,
        info,
      });
    }
  }

  _drawRect(graphics, viewPos, uid) {
    let stroke = this.options.rectangleDomainStrokeColor;
    let strokeWidth = this.options.rectangleDomainStrokeWidth;
    let strokeAlpha = this.options.rectangleDomainStrokeOpacity;
    let fill = this.options.rectangleDomainFillColor;
    let fillAlpha = this.options.rectangleDomainFillOpacity;

    if (this.hoveredAnno === uid) {
      stroke = this.options.hoverColor;
      strokeWidth = this.options.rectangleDomainStrokeWidth + 1 || 2;
      strokeAlpha = 1;
      fill = this.options.hoverColor;
      fillAlpha = this.options.rectangleDomainFillOpacity;
    }

    if (this.selectedAnno && this.selectedAnno.uid === uid) {
      stroke = this.options.selectColor;
      strokeWidth = this.options.rectangleDomainStrokeWidth + 1 || 2;
      strokeAlpha = 1;
      fill = this.options.selectColor;
      fillAlpha = max(0.33, this.options.rectangleDomainFillOpacity);
    }

    graphics.clear();
    if (this.options.trackBorderBgWidth) {
      this.setBorderStyle(
        graphics,
        this.options.trackBorderBgColor,
        this.options.trackBorderBgWidth,
        this.options.trackBorderBgAlpha,
      );
      this.setFill(graphics, fill, 0);
      graphics.drawRect(...viewPos);
    }
    this.setBorderStyle(graphics, stroke, strokeWidth, strokeAlpha);
    this.setFill(graphics, fill, fillAlpha);
    graphics.drawRect(...viewPos);
    graphics.__viewPos__ = viewPos;
  }

  context(graphics, viewPos, uid) {
    return (proc) => proc(graphics, viewPos, uid);
  }

  click(graphics, viewPos, uid, event, payload) {
    this.select(graphics, viewPos, uid);
    this.pubSub.publish('app.click', {
      type: 'annotation',
      event,
      payload,
    });
  }

  mouseDown() {
    this.sT = performance.now();
  }

  mouseUp(graphics, viewPos, uid, event, payload) {
    if (performance.now() - this.sT <= MOUSE_CLICK_TIME) {
      this.click(graphics, viewPos, uid, event, payload);
    }
  }

  hover(graphics, viewPos, uid) {
    this.hoveredAnno = uid;
    this._drawRect(graphics, viewPos, uid);
    this.animate();
  }

  focus(graphics, viewPos, uid) {
    this._drawRect(graphics, viewPos, uid);
    this.animate();
  }

  blur(graphics, viewPos, uid) {
    this.hoveredAnno = null;
    this._drawRect(graphics, viewPos, uid);
    this.animate();
  }

  select(graphics, viewPos, uid, silent = false) {
    let prevGfx = null;
    let prevUid = null;

    if (this.selectedAnno) {
      prevGfx = this.selectedAnno.graphics;
      prevUid = this.selectedAnno.uid;
    }

    this.selectedAnno = { graphics, uid };
    this.focus(graphics, viewPos, uid);

    if (this.options.onSelect && !silent) {
      window[this.options.onSelect](uid);
      this.pubSub.publish('annoSelected', uid);
    }

    if (prevGfx && prevUid) {
      this.blur(prevGfx, prevGfx.__viewPos__, prevUid);
    }
  }

  unselect() {
    const gfx = this.selectedAnno.graphics;
    const uid = this.selectedAnno.uid;
    this.selectedAnno = null;
    this.blur(gfx, gfx.__viewPos__, uid);
  }

  annoSelected(uid) {
    if (!this.selectedAnno || this.selectedAnno.uid !== uid) {
      if (this.selectedAnno) this.unselect();
      const gfx = this.drawnAnnoGfx[uid];
      if (gfx) this.select(gfx, gfx.__viewPos__, uid, true);
    }
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
      `translate(${this.position[0]},${this.position[1]})`,
    );

    track.appendChild(output);

    this.visibleAndFetchedTiles()
      .filter((tile) => tile.tileData && tile.tileData.length)
      .map((tile) => ({ graphics: tile.graphics, td: tile.tileData }))
      .forEach(({ td, graphics }) => {
        const gTile = document.createElement('g');

        gTile.setAttribute(
          'transform',
          `translate(${graphics.position.x},${graphics.position.y})scale(${graphics.scale.x},${graphics.scale.y})`,
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
    alpha = this.options.rectangleDomainStrokeOpacity,
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
    alpha = this.options.rectangleDomainFillOpacity,
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
