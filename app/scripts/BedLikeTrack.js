import boxIntersect from 'box-intersect';

import HorizontalTiled1DPixiTrack from './HorizontalTiled1DPixiTrack';

// Services
import { tileProxy } from './services';

// Utils
import { colorToHex } from './utils';

const GENE_RECT_WIDTH = 1;
const GENE_RECT_HEIGHT = 10;
const MAX_TEXTS = 20;

export class BedLikeTrack extends HorizontalTiled1DPixiTrack {
  constructor(scene, dataConfig, handleTilesetInfoReceived, options, animate) {
    super(scene, dataConfig, handleTilesetInfoReceived, options, animate);
    this.textFontSize = '10px';
    this.textFontFamily = 'Arial';

    this.drawnRects = {};
  }

  initTile(tile) {
    // create texts
    tile.texts = {};

    tile.rectGraphics = new PIXI.Graphics();
    tile.textGraphics = new PIXI.Graphics();

    tile.graphics.addChild(tile.rectGraphics);
    tile.graphics.addChild(tile.textGraphics);

    const MAX_TILE_ENTRIES = 50;

    tile.tileData.sort((a, b) => b.importance - a.importance);
    tile.tileData = tile.tileData.slice(0, MAX_TILE_ENTRIES);

    tile.tileData.forEach((td, i) => {
      const geneInfo = td.fields;
      const fill = this.options.fillColor ? this.options.fillColor : 'blue';

      tile.textWidths = {};

      // don't draw texts for the latter entries in the tile
      if (i >= MAX_TEXTS) { return; }

      // geneInfo[3] is the gene symbol
      const text = new PIXI.Text(geneInfo[3], { fontSize: this.textFontSize,
        fontFamily: this.textFontFamily,
        fill: colorToHex(fill) });
      if (this.flipText) { text.scale.x = -1; }

      text.anchor.x = 0.5;
      text.anchor.y = 1;

      tile.texts[geneInfo[3]] = text; // index by geneName

      tile.textGraphics.addChild(text);
    });

    tile.initialized = true;

    this.renderTile(tile);
    // this.draw();
  }

  destroyTile(tile) {
    // remove texts

    tile.tileData.forEach((td, i) => {
      delete this.drawnRects[td.uid];
    });

  }

  drawTile(tile) {

  }

  renderTile(tile) {
    if (!tile.initialized) { return; }

    tile.allRects = [];

    // store the scale at while the tile was drawn at so that
    // we only resize it when redrawing
    tile.drawnAtScale = this._xScale.copy();
    const fill = colorToHex(this.options.fillColor ? this.options.fillColor : 'blue');

    tile.tileData.forEach((td, i) => {
      // don't draw anything that has already been drawn
      if (td.uid in this.drawnRects) return;

      const geneInfo = td.fields;
      // the returned positions are chromosome-based and they need to
      // be converted to genome-based
      const chrOffset = +td.chrOffset;

      const txStart = +geneInfo[1] + chrOffset;
      const txEnd = +geneInfo[2] + chrOffset;
      let exonStarts = geneInfo[12],
        exonEnds = geneInfo[13];

      const txMiddle = (txStart + txEnd) / 2;

      const yMiddle = this.dimensions[1] / 2;
      const textYMiddle = this.dimensions[1] / 2;
      const geneName = geneInfo[3];

      // for when there's text
      // yMiddle -= 8;

      tile.rectGraphics.lineStyle(1, fill, 0.3);
      tile.rectGraphics.beginFill(fill, 0.3);

      // let height = valueScale(Math.log(+geneInfo[4]));
      // let width= height;

      const rectX = this._xScale(txMiddle) - GENE_RECT_WIDTH / 2;
      const rectY = yMiddle - GENE_RECT_HEIGHT / 2;

      const xStartPos = this._xScale(txStart);
      const xEndPos = this._xScale(txEnd);

      const MIN_SIZE_FOR_EXONS = 10;

      // graphics.drawRect(rectX, rectY, width, height);
      // this.allRects.push([rectX, rectY, GENE_RECT_WIDTH, GENE_RECT_HEIGHT, geneInfo[5]]);

      tile.rectGraphics.drawRect(xStartPos, rectY, xEndPos - xStartPos, GENE_RECT_HEIGHT);
      this.drawnRects[td.uid] = [xStartPos, rectY, xEndPos - xStartPos, GENE_RECT_HEIGHT];

      if (!tile.texts) {
        // tile probably hasn't been initialized yet
        return;
      }

      // don't draw texts for the latter entries in the tile
      if (i >= MAX_TEXTS) { return; }

      const text = tile.texts[geneName];

      text.position.x = this._xScale(txMiddle);
      // text.position.y = textYMiddle;
      text.style = { fontSize: this.textFontSize,
        fontFamily: this.textFontFamily,
        fill };

      if (!(geneInfo[3] in tile.textWidths)) {
        text.updateTransform();
        const textWidth = text.getBounds().width;

        tile.textWidths[geneInfo[3]] = textWidth;
      }
    });
  }

  calculateZoomLevel() {
    // offset by 2 because 1D tiles are more dense than 2D tiles
    // 1024 points per tile vs 256 for 2D tiles
    const xZoomLevel = tileProxy.calculateZoomLevel(this._xScale,
      this.tilesetInfo.min_pos[0],
      this.tilesetInfo.max_pos[0]);

    let zoomLevel = Math.min(xZoomLevel, this.maxZoom);
    zoomLevel = Math.max(zoomLevel, 0);

    return zoomLevel;
  }

  draw() {
    super.draw();
    // console.trace('drawing', this, this._xScale.domain(), this._xScale.range());

    // graphics.clear();

    const maxValue = 0;
    this.allTexts = [];
    this.allBoxes = [];

    for (const fetchedTileId in this.fetchedTiles) {
      const tile = this.fetchedTiles[fetchedTileId];

      // scale the rectangles

      const tileK = (tile.drawnAtScale.domain()[1] - tile.drawnAtScale.domain()[0]) / (this._xScale.domain()[1] - this._xScale.domain()[0]);
      const newRange = this._xScale.domain().map(tile.drawnAtScale);

      const posOffset = newRange[0];
      tile.rectGraphics.scale.x = tileK;
      tile.rectGraphics.position.x = -posOffset * tileK;

      // move the texts

      const parentInFetched = this.parentInFetched(tile);

      if (!tile.initialized) { continue; }

      tile.tileData.forEach((td, i) => {
        if (!tile.texts) {
          // tile probably hasn't been initialized yet
          return;
        }

        const geneInfo = td.fields;
        const geneName = geneInfo[3];
        const text = tile.texts[geneName];

        if (!text) { return; }

        const chrOffset = +td.chrOffset;
        const txStart = +geneInfo[1] + chrOffset;
        const txEnd = +geneInfo[2] + chrOffset;
        const txMiddle = (txStart + txEnd) / 2;
        let textYMiddle = this.dimensions[1] / 2;
        textYMiddle += 10;

        text.position.x = this._xScale(txMiddle);
        text.position.y = textYMiddle;


        if (!parentInFetched) {
          // TODO, change the line below to true if texts are desired in the future
          text.visible = false;

          const TEXT_MARGIN = 3;
          this.allBoxes.push([text.position.x - TEXT_MARGIN, textYMiddle - 1, text.position.x + tile.textWidths[geneInfo[3]] + TEXT_MARGIN, textYMiddle + 1]);
          this.allTexts.push({ importance: +geneInfo[5], text, caption: geneName, strand: geneInfo[5] });
        } else {
          text.visible = false;
        }
      });
    }


    /*
        for (let fetchedTileId in this.fetchedTiles) {
            let ft = this.fetchedTiles[fetchedTileId];

            ft.tileData.forEach(td => {
                let geneInfo = td.fields;
                if (+geneInfo[4] > maxValue)
                    maxValue = geneInfo[4];
            });
        }
        */

    // console.trace('draw', allTexts.length);
    this.hideOverlaps(this.allBoxes, this.allTexts);
  }

  hideOverlaps(allBoxes, allTexts) {
    // store the bounding boxes of the text objects so we can
    // calculate overlaps

    /*
        let allBoxes = allTexts.map(val => {
            let text = val.text;
            text.updateTransform();
            let b = text.getBounds();
            let box = [b.x, b.y, b.x + b.width, b.y + b.height];

            return box;
        });
        */

    const result = boxIntersect(allBoxes, (i, j) => {
      if (allTexts[i].importance > allTexts[j].importance) {
        allTexts[j].text.visible = false;
      } else {
        allTexts[i].text.visible = false;
      }
    });
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    this.pMain.position.y = this.position[1];
    this.pMain.position.x = this.position[0];
  }

  setDimensions(newDimensions) {
    super.setDimensions(newDimensions);

    // redraw the contents
    for (const tile of this.visibleAndFetchedTiles()) {
      tile.rectGraphics.clear();

      this.renderTile(tile);
    }
  }

  zoomed(newXScale, newYScale) {
    this.xScale(newXScale);
    this.yScale(newYScale);

    this.refreshTiles();

    this.draw();
  }

  exportSVG() {
    let track = null,
      base = null;

    if (super.exportSVG) {
      [base, track] = super.exportSVG();
    } else {
      base = document.createElement('g');
      track = base;
    }
    const output = document.createElement('g');
    output.setAttribute('transform',
      `translate(${this.position[0]},${this.position[1]})`);

    track.appendChild(output);

    for (let tile of this.visibleAndFetchedTiles()) {
      tile.tileData.forEach((td, i) => {
        let gTile = document.createElement('g')
        gTile.setAttribute('transform',
          `translate(${tile.rectGraphics.position.x},${tile.rectGraphics.position.y})scale(${tile.rectGraphics.scale.x},${tile.rectGraphics.scale.y})`);
        output.appendChild(gTile);

        if (td.uid in this.drawnRects) {
          let rect = this.drawnRects[td.uid];

          let r = document.createElement('rect');
          r.setAttribute('x', rect[0]);
          r.setAttribute('y', rect[1]);
          r.setAttribute('width', rect[2]);
          r.setAttribute('height', rect[3]);

          r.setAttribute('fill',  this.options.fillColor ? this.options.fillColor : 'blue')
          r.setAttribute('opacity', 0.3);

          r.style.stroke = this.options.fillColor ? this.options.fillColor : 'blue';
          r.style.strokeWidth = "1px";

          gTile.appendChild(r);
        }

      });
    }

    return [base, base];
  }
}

export default BedLikeTrack;
