import boxIntersect from 'box-intersect';
import { median, range } from 'd3-array';
import { scaleBand, scaleLinear } from 'd3-scale';
import * as PIXI from 'pixi.js';
import classifyPoint from 'robust-point-in-polygon';

import HorizontalTiled1DPixiTrack from './HorizontalTiled1DPixiTrack';

// Services
import { tileProxy } from './services';

// Utils
import {
  colorDomainToRgbaArray, colorToHex, createSVGElement,
  rgbToHex, segmentsToRows, valueToColor
} from './utils';

// Configs
import { HEATED_OBJECT_MAP } from './configs';

const GENE_RECT_HEIGHT = 10;
const MAX_TEXTS = 1000;
const MAX_TILE_ENTRIES = 5000;

class BedLikeTrack extends HorizontalTiled1DPixiTrack {
  constructor(context, options) {
    super(context, options);
    this.textFontSize = '10px';
    this.textFontFamily = 'Arial';

    this.drawnRects = {};

    if (this.options.colorEncoding) {
      if (this.options.colorRange) {
        this.colorScale = colorDomainToRgbaArray(this.options.colorRange);
      } else {
        this.colorScale = HEATED_OBJECT_MAP;
      }
    }
  }

  initTile(tile) {
    // create texts
    tile.texts = {};

    tile.rectGraphics = new PIXI.Graphics();
    tile.textGraphics = new PIXI.Graphics();

    tile.graphics.addChild(tile.rectGraphics);
    tile.graphics.addChild(tile.textGraphics);


    if (tile.tileData && tile.tileData.length) {
      tile.tileData.sort((a, b) => b.importance - a.importance);
      // tile.tileData = tile.tileData.slice(0, MAX_TILE_ENTRIES);

      let rows = [];
      if (!this.options || !this.options.valueColumn) {
        const segments = tile.tileData.map((x) => {
          const chrOffset = +x.chrOffset;

          return {
            from: +x.fields[1] + chrOffset,
            to: +x.fields[2] + chrOffset,
            value: x,
          };
        });

        rows = segmentsToRows(segments);
        // console.log('rows', rows);
      } else {
        rows = [tile.tileData.map(x => ({ value: x }))];
      }

      tile.rows = rows;

      tile.tileData.forEach((td, i) => {
        const geneInfo = td.fields;
        const fill = this.options.fillColor ? this.options.fillColor : 'blue';

        tile.textWidths = {};

        // don't draw texts for the latter entries in the tile
        if (i >= MAX_TEXTS) {
          return;
        }

        // geneInfo[3] is the gene symbol
        const text = new PIXI.Text(geneInfo[3], {
          fontSize: this.textFontSize,
          fontFamily: this.textFontFamily,
          fill: colorToHex(fill)
        });
        if (this.flipText) { text.scale.x = -1; }

        text.anchor.x = 0.5;
        text.anchor.y = 1;

        tile.texts[geneInfo[3]] = text; // index by geneName

        tile.textGraphics.addChild(text);
      });
    }

    tile.initialized = true;

    // console.log('init');
    // this.renderTile(tile);
    // this.draw();
  }

  destroyTile(tile) {
    // remove texts
    const zoomLevel = +tile.tileId.split('.')[0];
    tile.rectGraphics.clear();
    tile.rendered = false;

    if (tile.tileData && tile.tileData.length) {
      tile.tileData.forEach((td, i) => {
        if (this.drawnRects[zoomLevel] && this.drawnRects[zoomLevel][td.uid]) {
          if (this.drawnRects[zoomLevel][td.uid][2] === tile.tileId) {
            // this was the tile that drew that rectangle
            delete this.drawnRects[zoomLevel][td.uid];
          }
        }
      });
    }
  }

  removeTiles(toRemoveIds) {
    super.removeTiles(toRemoveIds);

    // Pete: we're going to rerender after destroying tiles to make sure
    // any rectangles that were listed under 'drawnRects' don't get
    // ignored
    // Fritz: this line is causing unnecessary rerenderings. Seems to work fine
    // without rerendering anyway, so I disabled it.
    // if (toRemoveIds.length > 0) this.rerender(this.options);
  }

  drawTile(tile) {
    if (this.options && this.options.valueColumn) {
      // there might no be a value scale if no valueColumn was specified
      if (this.valueScale) this.drawAxis(this.valueScale);
    }
  }

  rerender(options, force) {
    super.rerender(options, force);

    this.drawnRects = {};

    if (this.options.colorEncoding) {
      if (this.options.colorRange) {
        this.colorScale = colorDomainToRgbaArray(this.options.colorRange);
      } else {
        this.colorScale = HEATED_OBJECT_MAP;
      }
    }

    for (const tile of this.visibleAndFetchedTiles()) {
      this.destroyTile(tile);
      this.renderTile(tile);
    }
  }

  updateTile(tile) {
    // this.destroyTile(tile);
    this.renderTile(tile);
  }

  renderTile(tile) {
    let maxRows = 1;

    for (const tile1 of this.visibleAndFetchedTiles()) {
      if (!tile1.initialized) return;
      if (!tile1.rows) continue;

      maxRows = Math.max(tile1.rows.length, maxRows);
    }

    const zoomLevel = +tile.tileId.split('.')[0];

    // store the scale at while the tile was drawn at so that
    // we only resize it when redrawing

    if (tile.rendered) return;

    tile.drawnAtScale = this._xScale.copy();
    let fill = colorToHex(this.options.fillColor ? this.options.fillColor : 'blue');

    tile.rendered = true;

    if (this.options && this.options.valueColumn) {
      /**
       * These intervals come with some y-value that we want to plot
       */

      const min = this.options.colorEncodingRange
        ? +this.options.colorEncodingRange[0]
        : this.minVisibleValue();
      const max = this.options.colorEncodingRange
        ? +this.options.colorEncodingRange[1]
        : this.maxVisibleValue();

      if (this.options.colorEncoding) {
        this.valueColorScale = scaleLinear().domain([min, max]).range([0, 255]);
      } else {
        ([this.valueScale] = this.makeValueScale(
          min,
          this.calculateMedianVisibleValue(),
          max
        ));
      }
    }

    let maxValue = 0;

    // let rendered = 0;

    if (tile.tileData && tile.tileData.length) {
      const { rows } = tile;

      const rowScale = scaleBand()
        .domain(range(maxRows))
        .range([0, this.dimensions[1]]);

      for (let j = 0; j < rows.length; j++) {
        for (let i = 0; i < rows[j].length; i++) {
          // rendered += 1;
          const td = rows[j][i].value;
          // don't draw anything that has already been drawn
          if (zoomLevel in this.drawnRects && td.uid in this.drawnRects[zoomLevel]) {
            // indicate that this tile wants to draw this rectangle again
            // this.drawnRects[zoomLevel][td.uid][2].add(tile.tileId);
            continue;
          }

          const geneInfo = td.fields;

          // the returned positions are chromosome-based and they need to
          // be converted to genome-based
          const chrOffset = +td.chrOffset;

          const txStart = +geneInfo[1] + chrOffset;
          const txEnd = +geneInfo[2] + chrOffset;
          // const exonStarts = geneInfo[12];
          // const exonEnds = geneInfo[13];

          const txMiddle = (txStart + txEnd) / 2;

          let yMiddle = rowScale(j) + (rowScale.step() / 2);
          // let textYMiddle = rowScale(j) + (rowScale.step() / 2);
          const geneName = geneInfo[3];
          // let rectHeight = rowScale.step() / 2;
          let rectHeight = GENE_RECT_HEIGHT;

          if (this.options && this.options.valueColumn) {
            if (this.options.colorEncoding) {
              const rgb = valueToColor(
                this.valueColorScale,
                this.colorScale,
              )(+geneInfo[+this.options.valueColumn - 1]);
              fill = colorToHex(rgbToHex(...rgb));
            } else {
              // These intervals come with some y-value that we want to plot
              const value = +geneInfo[+this.options.valueColumn - 1];
              if (value > maxValue) {
                maxValue = value;
              }

              yMiddle = this.valueScale(value);
              rectHeight /= 2;
            }
          }

          // for when there's text
          // yMiddle -= 8;

          const opacity = this.options.fillOpacity || 0.3;

          tile.rectGraphics.lineStyle(1, fill, opacity);
          tile.rectGraphics.beginFill(fill, opacity);

          // let height = valueScale(Math.log(+geneInfo[4]));
          // let width= height;

          // const rectX = this._xScale(txMiddle) - (rectHeight / 2);
          const rectY = yMiddle - (rectHeight / 2);

          const xStartPos = this._xScale(txStart);
          const xEndPos = this._xScale(txEnd);

          let drawnPoly = null;

          if (
            geneInfo.length > 5
            && (geneInfo[5] === '+' || geneInfo[5] === '-')
            && (xEndPos - xStartPos < GENE_RECT_HEIGHT / 2)
          ) { // only draw if it's not too wide
            drawnPoly = [
              xStartPos, rectY,
              xStartPos + (GENE_RECT_HEIGHT / 2),
              rectY + (rectHeight / 2),
              xStartPos, rectY + rectHeight
            ];

            if (geneInfo[5] === '+') {
              tile.rectGraphics.drawPolygon(drawnPoly);
            } else {
              drawnPoly = [
                xStartPos, rectY,
                xStartPos - (GENE_RECT_HEIGHT / 2), rectY + (rectHeight / 2),
                xStartPos, rectY + rectHeight
              ];
              tile.rectGraphics.drawPolygon(drawnPoly);
            }
          } else {
            drawnPoly = [
              xStartPos, rectY,
              xStartPos + xEndPos - xStartPos, rectY,
              xStartPos + xEndPos - xStartPos, rectY + rectHeight,
              xStartPos, rectY + rectHeight
            ];

            tile.rectGraphics.drawPolygon(drawnPoly);
          }

          if (!this.drawnRects[zoomLevel]) this.drawnRects[zoomLevel] = {};

          this.drawnRects[zoomLevel][td.uid] = [
            drawnPoly,
            {
              start: txStart,
              end: txEnd,
              value: td,
            },
            tile.tileId
          ];

          // tile probably hasn't been initialized yet
          if (!tile.texts) return;

          // don't draw texts for the latter entries in the tile
          if (i >= MAX_TEXTS) continue;

          if (!tile.texts[geneName]) continue;

          const text = tile.texts[geneName];

          text.position.x = this._xScale(txMiddle);
          // text.position.y = textYMiddle;
          text.style = {
            fontSize: this.textFontSize,
            fontFamily: this.textFontFamily,
            fill,
          };

          if (!(geneInfo[3] in tile.textWidths)) {
            text.updateTransform();
            const textWidth = text.getBounds().width;

            tile.textWidths[geneInfo[3]] = textWidth;
          }
        }
      }
    }
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

  minVisibleValue() {
    let visibleAndFetchedIds = this.visibleAndFetchedIds();

    if (visibleAndFetchedIds.length === 0) {
      visibleAndFetchedIds = Object.keys(this.fetchedTiles);
    }

    let min = Math.min.apply(
      null,
      visibleAndFetchedIds
        .map(x => this.fetchedTiles[x])
        .filter(x => x.tileData && x.tileData.length)
        .map(x => Math.min.apply(
          null,
          x.tileData
            .sort((a, b) => b.importance - a.importance)
            .slice(0, MAX_TILE_ENTRIES)
            .map(y => +y.fields[+this.options.valueColumn - 1])
            .filter(y => !Number.isNaN(y))
        ))
    );

    // if there's no data, use null
    if (min === Number.MAX_SAFE_INTEGER) { min = null; }

    return min;
  }

  maxVisibleValue() {
    let visibleAndFetchedIds = this.visibleAndFetchedIds();

    if (visibleAndFetchedIds.length === 0) {
      visibleAndFetchedIds = Object.keys(this.fetchedTiles);
    }

    let max = Math.max.apply(
      null,
      visibleAndFetchedIds
        .map(x => this.fetchedTiles[x])
        .filter(x => x.tileData && x.tileData.length)
        .map(x => Math.max.apply(
          null,
          x.tileData
            .sort((a, b) => b.importance - a.importance)
            .slice(0, MAX_TILE_ENTRIES)
            .map(y => +y.fields[+this.options.valueColumn - 1])
            .filter(y => !Number.isNaN(y))
        ))
    );

    // if there's no data, use null
    if (max === Number.MIN_SAFE_INTEGER) { max = null; }

    return max;
  }

  calculateMedianVisibleValue() {
    if (this.areAllVisibleTilesLoaded()) {
      this.allTilesLoaded();
    }

    let visibleAndFetchedIds = this.visibleAndFetchedIds();

    if (visibleAndFetchedIds.length === 0) {
      visibleAndFetchedIds = Object.keys(this.fetchedTiles);
    }

    const values = [].concat(...visibleAndFetchedIds
      .map(x => this.fetchedTiles[x])
      .filter(x => x.tileData && x.tileData.length)
      .map(x => x.tileData
        .sort((a, b) => b.importance - a.importance)
        .slice(0, MAX_TILE_ENTRIES)
        .map(y => +y.fields[+this.options.valueColumn - 1]))).filter(x => x > 0);

    this.medianVisibleValue = median(values);
  }

  draw() {
    super.draw();

    // graphics.clear();

    // const maxValue = 0;
    this.allTexts = [];
    this.allBoxes = [];

    for (const fetchedTileId in this.fetchedTiles) {
      const tile = this.fetchedTiles[fetchedTileId];

      // hasn't been rendered yet
      if (!tile.drawnAtScale) {
        return;
      }

      // scale the rectangles
      //
      const tileK = (tile.drawnAtScale.domain()[1] - tile.drawnAtScale.domain()[0])
        / (this._xScale.domain()[1] - this._xScale.domain()[0]);
      const newRange = this._xScale.domain().map(tile.drawnAtScale);

      const posOffset = newRange[0];
      tile.rectGraphics.scale.x = tileK;
      tile.rectGraphics.position.x = -posOffset * tileK;

      // move the texts

      const parentInFetched = this.parentInFetched(tile);

      if (!tile.initialized) { continue; }

      if (tile.tileData && tile.tileData.length) {
        tile.tileData.forEach((td) => {
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
            this.allBoxes.push([text.position.x - TEXT_MARGIN, textYMiddle - 1,
              text.position.x + tile.textWidths[geneInfo[3]] + TEXT_MARGIN, textYMiddle + 1]);
            this.allTexts.push({
              importance: +geneInfo[5],
              text,
              caption: geneName,
              strand: geneInfo[5]
            });
          } else {
            text.visible = false;
          }
        });
      }
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

    boxIntersect(allBoxes, (i, j) => {
      if (allTexts[i].importance > allTexts[j].importance) {
        allTexts[j].text.visible = false;
      } else {
        allTexts[i].text.visible = false;
      }
    });
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    [this.pMain.position.x, this.pMain.position.y] = this.position;
  }

  setDimensions(newDimensions) {
    super.setDimensions(newDimensions);

    /*
    // redraw the contents
    for (const tile of this.visibleAndFetchedTiles()) {
      // this.destroyTile(tile);
      this.renderTile(tile);
    }

    this.draw();
    */
  }

  zoomed(newXScale, newYScale) {
    this.xScale(newXScale);
    this.yScale(newYScale);

    this.refreshTiles();

    this.draw();
  }

  exportSVG() {
    let track = null;
    let base = null;

    if (super.exportSVG) {
      [base, track] = super.exportSVG();
    } else {
      base = createSVGElement('g');
      track = base;
    }
    const output = createSVGElement('g');
    output.setAttribute('transform',
      `translate(${this.position[0]},${this.position[1]})`);

    track.appendChild(output);

    for (const tile of this.visibleAndFetchedTiles()) {
      if (!tile.tileData.length) {
        continue;
      }

      tile.tileData.forEach((td) => {
        const zoomLevel = +tile.tileId.split('.')[0];

        const gTile = createSVGElement('g');
        gTile.setAttribute('transform',
          `translate(${tile.rectGraphics.position.x},${tile.rectGraphics.position.y})scale(${tile.rectGraphics.scale.x},${tile.rectGraphics.scale.y})`);
        output.appendChild(gTile);

        if (this.drawnRects[zoomLevel] && td.uid in this.drawnRects[zoomLevel]) {
          const rect = this.drawnRects[zoomLevel][td.uid][0];
          const r = createSVGElement('path');
          let d = `M ${rect[0]} ${rect[1]}`;

          for (let i = 2; i < rect.length; i += 2) {
            d += ` L ${rect[i]} ${rect[i + 1]}`;
          }

          r.setAttribute('d', d);
          r.setAttribute('fill', this.options.fillColor ? this.options.fillColor : 'blue');
          r.setAttribute('opacity', 0.3);

          r.style.stroke = this.options.fillColor ? this.options.fillColor : 'blue';
          r.style.strokeWidth = '1px';

          gTile.appendChild(r);
        }
      });
    }

    return [base, base];
  }

  getMouseOverHtml(trackX, trackY) {
    if (!this.tilesetInfo) {
      return '';
    }

    const zoomLevel = this.calculateZoomLevel();
    // const tileWidth = tileProxy.calculateTileWidth(this.tilesetInfo,
    //   zoomLevel, this.tilesetInfo.tile_size);

    // the position of the tile containing the query position
    // const tilePos = this._xScale.invert(trackX) / tileWidth;

    // const posInTileX = this.tilesetInfo.tile_size * (tilePos - Math.floor(tilePos));

    // const tileId = this.tileToLocalId([zoomLevel, Math.floor(tilePos)]);
    // const fetchedTile = this.fetchedTiles[tileId];

    // const dataX = this._xScale.invert(trackX);

    if (this.drawnRects[zoomLevel]) {
      const visibleRects = Object.values(this.drawnRects[zoomLevel]);

      for (let i = 0; i < visibleRects.length; i++) {
        const point = [trackX, trackY];
        const rect = visibleRects[i][0].slice(0);
        const newArr = [];
        while (rect.length) newArr.push(rect.splice(0, 2));

        const pc = classifyPoint(newArr, point);

        if (pc === -1) {
          const parts = visibleRects[i][1].value.fields.slice(3);

          return parts.join(' ');
        }
      }
    }

    return '';
  }
}

export default BedLikeTrack;
