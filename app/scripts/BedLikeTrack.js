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
  colorDomainToRgbaArray, colorToHex, rgbToHex, segmentsToRows, valueToColor
} from './utils';

// Configs
import { HEATED_OBJECT_MAP } from './configs';

const GENE_RECT_HEIGHT = 16;
const MAX_TEXTS = 50;
const MAX_TILE_ENTRIES = 5000;
const STAGGERED_OFFSET = 5;
const FONT_SIZE = 14;
// the label text should have a white outline so that it's more
// visible against a similar colored background
const TEXT_STYLE = {
  fontSize: `${FONT_SIZE}px`,
  fontFamily: 'Arial',
  stroke: 'white',
  strokeThickness: 2,
  fontWeight: 400,
  dropShadow: true,
  dropShadowColor: 'white',
  dropShadowDistance: 0,
  dropShadowBlur: 2,
};

class BedLikeTrack extends HorizontalTiled1DPixiTrack {
  constructor(context, options) {
    super(context, options);

    this.drawnRects = {};
    this.allDrawnRects = {};

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

    let plusStrandRows = [];
    let minusStrandRows = [];

    if (tile.tileData && tile.tileData.length) {
      tile.tileData.sort((a, b) => b.importance - a.importance);
      // tile.tileData = tile.tileData.slice(0, MAX_TILE_ENTRIES);

      if (!this.options || !this.options.valueColumn) {
        // no value column so we can break entries up into separate
        // plus and minus strand segments
        const segments = tile.tileData.map((x) => {
          const chrOffset = +x.chrOffset;

          return {
            from: +x.fields[1] + chrOffset,
            to: +x.fields[2] + chrOffset,
            value: x,
            text: x.fields[3],
            strand: x.fields.length >= 6 && x.fields[5] === '-' ? '-' : '+',
          };
        });

        plusStrandRows = segmentsToRows(segments.filter(x => x.strand === '+'));
        minusStrandRows = segmentsToRows(segments.filter(x => x.strand === '-'));
      } else {
        plusStrandRows = [tile.tileData.map(x => ({ value: x }))];
      }

      tile.plusStrandRows = plusStrandRows;
      tile.minusStrandRows = minusStrandRows;

      if (this.options.showTexts) {
        tile.tileData.forEach((td, i) => {
          const geneInfo = td.fields;

          tile.textWidths = {};
          tile.textHeights = {};

          // don't draw texts for the latter entries in the tile
          if (i >= MAX_TEXTS) {
            return;
          }

          // geneInfo[3] is the gene symbol
          const text = new PIXI.Text(geneInfo[3], TEXT_STYLE);
          if (this.flipText) { text.scale.x = -1; }

          text.anchor.x = 0.5;
          text.anchor.y = 0.5;

          tile.texts[td.uid] = text; // index by geneName

          // console.log('adding text:', text.text);
          tile.textGraphics.addChild(text);
        });
      }
    }

    tile.initialized = true;

    // console.log('init');
    // this.renderTile(tile);
    // this.draw();
  }

  /**
   * Remove the tile's rectangles from the list of drawnRects so that they
   * can be drawn again.
   */
  removeTileRects(tile) {
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

  destroyTile(tile) {
    // remove texts
    this.removeTileRects(tile);

    tile.graphics.removeChild(tile.textGraphics);
    tile.graphics.removeChild(tile.rectGraphics);
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
      this.initTile(tile);
      this.renderTile(tile);
    }
  }

  updateTile(tile) {
    // this.destroyTile(tile);
    if (this.areAllVisibleTilesLoaded()) {
      // this.destroyTile(tile);
      // this.initTile(tile);
      this.renderTile(tile);
    }
  }

  /**
   * Use this only when there's one row
   *
   * @return {[type]} [description]
   */
  allVisibleRects() {
    const allRects = {};

    Object.values(this.fetchedTiles).forEach((x) => {
      if (!x.plusStrandRows) return;

      for (const row of x.plusStrandRows[0]) {
        if (!allRects[row.value.uid]) {
          allRects[row.value.uid] = row;
        }
      }
    });

    const sortedRows = Object.values(allRects)
      .sort((a, b) => a.from - b.from);

    let startPos = 0;
    let startStaggered = 0;

    // find if any values have staggeredStartPosition set
    for (let i = 0; i < sortedRows.length; i++) {
      if (sortedRows[i].staggeredStartPosition !== undefined) {
        startPos = i;
        startStaggered = sortedRows[i].staggeredStartPosition;
        break;
      }
    }


    for (let i = startPos; i < sortedRows.length; i++) {
      sortedRows[i].staggeredStartPosition = (startStaggered + i - startPos) % 2;
    }

    for (let i = startPos; i >= 0 && sortedRows.length; i--) {
      sortedRows[i].staggeredStartPosition = (startStaggered + startPos - i) % 2;
    }

    // sortedRows.forEach((x, i) => {
    //   allRects[x.value.uid].staggeredStartPosition = i % 2;
    // });
    // console.log('sortedRows:', sortedRows);

    // console.log('visibleAndFetchedIds', this.visibleAndFetchedIds());
    return allRects;
  }

  drawSegmentStyle(tile, xStartPos, xEndPos, rectY, rectHeight, strand) {
    const hw = 0.1;  // half width of the line

    const centerY = rectY + rectHeight / 2;

    const poly = [
      xStartPos, rectY,  // upper left
      xStartPos + 2 * hw, rectY,  // upper right
      xStartPos + 2 * hw, centerY - hw,
      xEndPos - 2 * hw, centerY - hw,
      xEndPos - 2 * hw, rectY,
      xEndPos, rectY,
      xEndPos, rectY + rectHeight,
      xEndPos - 2 * hw, rectY + rectHeight,
      xEndPos - 2 * hw, centerY + hw,
      xStartPos + 2 * hw, centerY + hw,
      xStartPos + 2 * hw, rectY + rectHeight,
      xStartPos, rectY + rectHeight,
    ];

    tile.rectGraphics.drawPolygon(poly);
    return poly;
  }

  drawPoly(tile, xStartPos, xEndPos, rectY, rectHeight, strand) {
    let drawnPoly = null;

    if (this.options.annotationStyle === 'segment') {
      return this.drawSegmentStyle(
        tile, xStartPos, xEndPos, rectY, rectHeight, strand
      );
    }

    if (
      (strand === '+' || strand === '-')
      && (xEndPos - xStartPos < GENE_RECT_HEIGHT / 2)
    ) { // only draw if it's not too wide
      drawnPoly = [
        xStartPos, rectY, // top
        xStartPos + (rectHeight / 2), rectY + (rectHeight / 2), // right point
        xStartPos, rectY + rectHeight // bottom
      ];

      if (strand === '+') {
        tile.rectGraphics.drawPolygon(drawnPoly);
      } else {
        drawnPoly = [
          xEndPos, rectY, // top
          xEndPos - (rectHeight / 2), rectY + (rectHeight / 2), // left point
          xEndPos, rectY + rectHeight // bottom
        ];
        tile.rectGraphics.drawPolygon(drawnPoly);
      }
    } else {
      if (strand === '+') {
        drawnPoly = [
          xStartPos, rectY, // left top
          xEndPos - (rectHeight / 2), rectY, // right top
          xEndPos, rectY + (rectHeight / 2),
          xEndPos - (rectHeight / 2), rectY + rectHeight, // right bottom
          xStartPos, rectY + rectHeight // left bottom
        ];
      } else if (strand === '-') {
        drawnPoly = [
          xStartPos + (rectHeight / 2), rectY, // left top
          xEndPos, rectY, // right top
          xEndPos, rectY + rectHeight, // right bottom
          xStartPos + (rectHeight / 2), rectY + rectHeight, // left bottom
          xStartPos, rectY + rectHeight / 2
        ];
      } else {
        drawnPoly = [
          xStartPos, rectY, // left top
          xEndPos, rectY, // right top
          xEndPos, rectY + rectHeight, // right bottom
          xStartPos, rectY + rectHeight, // left bottom
        ];
      }

      tile.rectGraphics.drawPolygon(drawnPoly);
    }

    return drawnPoly;
  }

  renderRows(tile, rows, maxRows, startY, endY, fill) {
    const zoomLevel = +tile.tileId.split('.')[0];
    let maxValue = Number.MIN_SAFE_INTEGER;
    // console.log('startY', startY, 'endY', endY, range(maxRows), rows);

    const rowScale = scaleBand()
      .domain(range(maxRows))
      .range([startY, endY]);

    this.allVisibleRects();
    let allRects = null;

    if (this.options.staggered) {
      allRects = this.allVisibleRects();
    }

    for (let j = 0; j < rows.length; j++) {
      for (let i = 0; i < rows[j].length; i++) {
        // rendered += 1;
        const td = rows[j][i].value;
        const geneInfo = td.fields;

        // the returned positions are chromosome-based and they need to
        // be converted to genome-based
        const chrOffset = +td.chrOffset;
        const txStart = +geneInfo[1] + chrOffset;
        const txEnd = +geneInfo[2] + chrOffset;
        const txMiddle = (txStart + txEnd) / 2;
        let yMiddle = rowScale(j) + (rowScale.step() / 2);
        const rectHeight = this.options.annotationHeight || GENE_RECT_HEIGHT;

        // if the regions are scaled according to a value column their height needs to
        // be adjusted
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
            // rectHeight /= 2;
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
        let rectY = yMiddle - (rectHeight / 2);
        const xStartPos = this._xScale(txStart);
        const xEndPos = this._xScale(txEnd);

        if (this.options.staggered) {
          const rect = allRects[td.uid];

          if (rect.staggeredStartPosition) {
            rectY -= STAGGERED_OFFSET / 2;
          } else {
            rectY += STAGGERED_OFFSET / 2;
          }
        }

        let alreadyDrawn = true;
        // don't draw anything that has already been drawn
        if (!(zoomLevel in this.drawnRects && td.uid in this.drawnRects[zoomLevel])) {
          alreadyDrawn = false;

          if (!this.drawnRects[zoomLevel]) this.drawnRects[zoomLevel] = {};

          const drawnPoly = this.drawPoly(tile, xStartPos, xEndPos,
            rectY, rectHeight, geneInfo[5]);

          this.drawnRects[zoomLevel][td.uid] = [
            drawnPoly,
            {
              start: txStart,
              end: txEnd,
              value: td,
            },
            tile.tileId
          ];
        }

        if (!this.options.showTexts) continue;
        // console.log('geneName:', geneName);
        // tile probably hasn't been initialized yet
        if (!tile.texts) return;

        // don't draw texts for the latter entries in the tile
        if (i >= MAX_TEXTS) continue;

        if (!tile.texts[td.uid]) continue;

        const text = tile.texts[td.uid];

        text.position.x = this._xScale(txMiddle);
        text.position.y = rectY + rectHeight / 2;

        if (alreadyDrawn) {
          text.alreadyDrawn = true;
        }

        text.style = Object.assign(TEXT_STYLE, { fill });

        if (!(geneInfo[3] in tile.textWidths)) {
          text.updateTransform();
          const textWidth = text.getBounds().width;
          const textHeight = text.getBounds().height;

          tile.textWidths[geneInfo[3]] = textWidth;
          tile.textHeights[geneInfo[3]] = textHeight;
        }
      }
    }
  }

  renderTile(tile) {
    let maxPlusRows = 1;
    let maxMinusRows = 1;

    for (const otherTile of this.visibleAndFetchedTiles()) {
      if (!otherTile.initialized) return;
      if (!otherTile.plusStrandRows && !otherTile.minusStrandRows) continue;

      maxPlusRows = Math.max(otherTile.plusStrandRows.length, maxPlusRows);
      maxMinusRows = Math.max(otherTile.minusStrandRows.length, maxMinusRows);
    }

    // store the scale at while the tile was drawn at so that
    // we only resize it when redrawing

    if (tile.rendered) {
      this.removeTileRects(tile);
      // return;
      // tile.rectGraphics.clear();
      //      return;
    }

    tile.drawnAtScale = this._xScale.copy();
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

    // let rendered = 0;

    if (tile.tileData && tile.tileData.length) {
      // console.log('maxPlusRows', maxPlusRows);
      // console.log('maxMinusRows', maxMinusRows);

      const fill = colorToHex(this.options.plusStrandColor || this.options.fillColor || 'blue');
      const minusStrandFill = colorToHex(this.options.minusStrandColor || this.options.fillColor || 'purple');

      const MIDDLE_SPACE = 0;
      const plusHeight = maxPlusRows * this.dimensions[1]
        / (maxPlusRows + maxMinusRows) - MIDDLE_SPACE / 2;

      this.renderRows(tile, tile.plusStrandRows, maxPlusRows,
        0, plusHeight, fill);
      this.renderRows(tile, tile.minusStrandRows, maxMinusRows,
        plusHeight + MIDDLE_SPACE / 2, this.dimensions[1], minusStrandFill);
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
          const text = tile.texts[td.uid];

          if (!text) { return; }

          const chrOffset = +td.chrOffset;
          const txStart = +geneInfo[1] + chrOffset;
          const txEnd = +geneInfo[2] + chrOffset;
          const txMiddle = (txStart + txEnd) / 2;

          text.position.x = this._xScale(txMiddle);

          if (!parentInFetched && !text.alreadyDrawn) {
            text.visible = true;

            // TODO, change the line below to true if texts are desired in the future
            // text.visible = false;

            const TEXT_MARGIN = 3;
            this.allBoxes.push([text.position.x - TEXT_MARGIN,
              text.position.y - tile.textHeights[geneInfo[3]] / 2,
              text.position.x + tile.textWidths[geneInfo[3]] + TEXT_MARGIN,
              text.position.y + tile.textHeights[geneInfo[3]] / 2]);
            this.allTexts.push({
              importance: td.importance,
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

    // console.log('length:', this.allBoxes.length);

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
      base = document.createElement('g');
      track = base;
    }
    const output = document.createElement('g');
    output.setAttribute('transform',
      `translate(${this.position[0]},${this.position[1]})`);

    track.appendChild(output);
    const rectOutput = document.createElement('g');
    const textOutput = document.createElement('g');

    output.appendChild(rectOutput);
    output.appendChild(textOutput);

    for (const tile of this.visibleAndFetchedTiles()) {
      if (!tile.tileData.length) {
        continue;
      }

      tile.tileData.forEach((td) => {
        const zoomLevel = +tile.tileId.split('.')[0];

        const gTile = document.createElement('g');
        gTile.setAttribute('transform',
          `translate(${tile.rectGraphics.position.x},${tile.rectGraphics.position.y})scale(${tile.rectGraphics.scale.x},${tile.rectGraphics.scale.y})`);
        rectOutput.appendChild(gTile);

        if (this.drawnRects[zoomLevel] && td.uid in this.drawnRects[zoomLevel]) {
          const rect = this.drawnRects[zoomLevel][td.uid][0];
          const r = document.createElement('path');
          let d = `M ${rect[0]} ${rect[1]}`;

          for (let i = 2; i < rect.length; i += 2) {
            d += ` L ${rect[i]} ${rect[i + 1]}`;
          }

          const geneInfo = td.fields;

          let fill = this.options.plusStrandColor || this.options.fillColor || 'blue';
          const minusStrandFill = this.options.minusStrandColor || this.options.fillColor || 'purple';

          if (geneInfo[5] === '-') {
            fill = minusStrandFill;
          }

          r.setAttribute('d', d);
          r.setAttribute('fill', fill);
          r.setAttribute('opacity', 0.3);

          r.style.stroke = fill;
          r.style.strokeWidth = '1px';

          gTile.appendChild(r);

          if (tile.texts[td.uid]) {
            const text = tile.texts[td.uid];

            if (!text.visible) {
              return;
            }

            const g = document.createElement('g');
            const t = document.createElement('text');

            textOutput.appendChild(g);
            g.appendChild(t);
            g.setAttribute(
              'transform',
              `translate(${text.x},${text.y})scale(${text.scale.x},1)`
            );

            t.setAttribute('text-anchor', 'middle');
            t.setAttribute('font-family', TEXT_STYLE.fontFamily);
            t.setAttribute('font-size', TEXT_STYLE.fontSize);
            t.setAttribute('font-weight', 'bold');
            t.setAttribute('dy', '5px');
            t.setAttribute('fill', fill);
            t.setAttribute('stroke', TEXT_STYLE.stroke);
            t.setAttribute('stroke-width', '0.4');
            t.setAttribute('text-shadow', '0px 0px 2px grey');

            t.innerHTML = text.text;
          }
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

    // // the position of the tile containing the query position
    // const tilePos = this._xScale.invert(trackX) / tileWidth;
    // console.log('tilePos', tilePos);

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
          const parts = visibleRects[i][1].value.fields;

          return parts.join(' ');
        }
      }
    }

    return '';
  }
}

export default BedLikeTrack;
