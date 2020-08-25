import boxIntersect from 'box-intersect';
import { median, range } from 'd3-array';
import { scaleBand, scaleLinear } from 'd3-scale';
import classifyPoint from 'robust-point-in-polygon';
import { zoomIdentity } from 'd3-zoom';

import HorizontalTiled1DPixiTrack from './HorizontalTiled1DPixiTrack';

// Services
import { tileProxy } from './services';
// Utils
import {
  colorDomainToRgbaArray,
  colorToHex,
  segmentsToRows,
  trackUtils,
  valueToColor,
} from './utils';

// Configs
import { GLOBALS, HEATED_OBJECT_MAP } from './configs';

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

    this.valueScaleTransform = zoomIdentity;
  }

  /** Factor out some initialization code for the track. This is
   necessary because we can now load tiles synchronously and so
   we have to check if the track is initialized in renderTiles
   and not in the constructor */
  initialize() {
    if (this.initialized) return;

    [this.prevK, this.vertK, this.vertY] = [1, 1, 0];

    if (!this.drawnRects) {
      this.drawnRects = {};
    }

    if (!this.colorScale) {
      if (this.options.colorRange) {
        this.colorScale = colorDomainToRgbaArray(this.options.colorRange);
      } else {
        this.colorScale = HEATED_OBJECT_MAP;
      }
    }

    this.initialized = true;
  }

  initTile(tile) {
    // create texts
    tile.texts = {};

    tile.rectGraphics = new GLOBALS.PIXI.Graphics();
    tile.textGraphics = new GLOBALS.PIXI.Graphics();

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

        plusStrandRows = segmentsToRows(
          segments.filter((x) => x.strand === '+'),
        );
        minusStrandRows = segmentsToRows(
          segments.filter((x) => x.strand === '-'),
        );
      } else {
        plusStrandRows = [tile.tileData.map((x) => ({ value: x }))];
      }

      tile.plusStrandRows = plusStrandRows;
      tile.minusStrandRows = minusStrandRows;

      if (this.options.showTexts) {
        tile.tileData.forEach((td, i) => {
          const geneInfo = td.fields;

          // A random importance helps with selective hiding
          // of overlapping texts
          if (!td.importance) {
            td.importance = Math.random();
          }
          tile.textWidths = {};
          tile.textHeights = {};

          // don't draw too many texts so they don't bog down the frame rate
          if (i >= (+this.options.maxTexts || MAX_TEXTS)) {
            return;
          }

          // geneInfo[3] is the gene symbol
          const text = new GLOBALS.PIXI.Text(geneInfo[3], {
            ...TEXT_STYLE,
            fontSize: +this.options.fontSize || TEXT_STYLE.fontSize,
          });
          if (this.flipText) {
            text.scale.x = -1;
          }

          text.anchor.x = 0.5;
          text.anchor.y = 0.5;

          tile.texts[td.uid] = text; // index by geneName

          tile.textGraphics.addChild(text);
        });
      }
    }

    tile.initialized = true;
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

    // this will get instantiated if a value column is specified
    this.valueScale = null;
    this.drawnRects = {};

    if (this.options.colorRange) {
      this.colorScale = colorDomainToRgbaArray(this.options.colorRange);
    } else {
      this.colorScale = HEATED_OBJECT_MAP;
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

    const sortedRows = Object.values(allRects).sort((a, b) => a.from - b.from);

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
      sortedRows[i].staggeredStartPosition =
        (startStaggered + i - startPos) % 2;
    }

    for (let i = startPos; i >= 0 && sortedRows.length; i--) {
      sortedRows[i].staggeredStartPosition =
        (startStaggered + startPos - i) % 2;
    }

    return allRects;
  }

  drawSegmentStyle(tile, xStartPos, xEndPos, rectY, rectHeight, strand) {
    const hw = 0.1; // half width of the line

    const centerY = rectY + rectHeight / 2;

    const poly = [
      xStartPos,
      rectY, // upper left
      xStartPos + 2 * hw,
      rectY, // upper right
      xStartPos + 2 * hw,
      centerY - hw,
      xEndPos - 2 * hw,
      centerY - hw,
      xEndPos - 2 * hw,
      rectY,
      xEndPos,
      rectY,
      xEndPos,
      rectY + rectHeight,
      xEndPos - 2 * hw,
      rectY + rectHeight,
      xEndPos - 2 * hw,
      centerY + hw,
      xStartPos + 2 * hw,
      centerY + hw,
      xStartPos + 2 * hw,
      rectY + rectHeight,
      xStartPos,
      rectY + rectHeight,
    ];

    tile.rectGraphics.drawPolygon(poly);
    return poly;
  }

  drawPoly(tile, xStartPos, xEndPos, rectY, rectHeight, strand) {
    let drawnPoly = null;

    if (this.options.annotationStyle === 'segment') {
      return this.drawSegmentStyle(
        tile,
        xStartPos,
        xEndPos,
        rectY,
        rectHeight,
        strand,
      );
    }

    if (
      (strand === '+' || strand === '-') &&
      xEndPos - xStartPos < GENE_RECT_HEIGHT / 2
    ) {
      // only draw if it's not too wide
      drawnPoly = [
        xStartPos,
        rectY, // top
        xStartPos + rectHeight / 2,
        rectY + rectHeight / 2, // right point
        xStartPos,
        rectY + rectHeight, // bottom
      ];

      if (strand === '+') {
        tile.rectGraphics.drawPolygon(drawnPoly);
      } else {
        drawnPoly = [
          xEndPos,
          rectY, // top
          xEndPos - rectHeight / 2,
          rectY + rectHeight / 2, // left point
          xEndPos,
          rectY + rectHeight, // bottom
        ];
        tile.rectGraphics.drawPolygon(drawnPoly);
      }
    } else {
      if (strand === '+') {
        drawnPoly = [
          xStartPos,
          rectY, // left top
          xEndPos - rectHeight / 2,
          rectY, // right top
          xEndPos,
          rectY + rectHeight / 2,
          xEndPos - rectHeight / 2,
          rectY + rectHeight, // right bottom
          xStartPos,
          rectY + rectHeight, // left bottom
        ];
      } else if (strand === '-') {
        drawnPoly = [
          xStartPos + rectHeight / 2,
          rectY, // left top
          xEndPos,
          rectY, // right top
          xEndPos,
          rectY + rectHeight, // right bottom
          xStartPos + rectHeight / 2,
          rectY + rectHeight, // left bottom
          xStartPos,
          rectY + rectHeight / 2,
        ];
      } else {
        drawnPoly = [
          xStartPos,
          rectY, // left top
          xEndPos,
          rectY, // right top
          xEndPos,
          rectY + rectHeight, // right bottom
          xStartPos,
          rectY + rectHeight, // left bottom
        ];
      }

      tile.rectGraphics.drawPolygon(drawnPoly);
    }

    return drawnPoly;
  }

  /** The value scale is used to arrange annotations vertically
      based on a value */
  setValueScale() {
    this.valueScale = null;

    if (this.options && this.options.valueColumn) {
      /**
       * These intervals come with some y-value that we want to plot
       */

      const min = this.options.colorEncodingRange
        ? +this.options.colorEncodingRange[0]
        : this.minVisibleValueInTiles(+this.options.valueColumn);
      const max = this.options.colorEncodingRange
        ? +this.options.colorEncodingRange[1]
        : this.maxVisibleValueInTiles(+this.options.valueColumn);

      if (this.options.valueColumn) {
        [this.valueScale] = this.makeValueScale(
          min,
          this.calculateMedianVisibleValue(+this.options.valueColumn),
          max,
        );
      }
    }
  }

  /** The color value scale is used to map some value to a coloring */
  setColorValueScale() {
    this.colorValueScale = null;

    if (
      this.options &&
      this.options.colorEncoding &&
      this.options.colorEncoding !== 'itemRgb'
    ) {
      const min = this.options.colorEncodingRange
        ? +this.options.colorEncodingRange[0]
        : this.minVisibleValueInTiles(+this.options.colorEncoding);
      const max = this.options.colorEncodingRange
        ? +this.options.colorEncodingRange[1]
        : this.maxVisibleValueInTiles(+this.options.colorEncoding);

      this.colorValueScale = scaleLinear().domain([min, max]).range([0, 255]);
    }
  }

  renderRows(tile, rows, maxRows, startY, endY, fill) {
    const zoomLevel = +tile.tileId.split('.')[0];
    let maxValue = Number.MIN_SAFE_INTEGER;

    this.initialize();

    const rowScale = scaleBand()
      .domain(range(maxRows))
      .range([startY, endY])
      .paddingInner(0.3);

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
        let yMiddle = rowScale(j) + rowScale.step() / 2;

        let rectHeight = this.options.annotationHeight || GENE_RECT_HEIGHT;

        if (rectHeight === 'scaled') {
          rectHeight = rowScale.bandwidth();

          if (this.options.maxAnnotationHeight) {
            rectHeight = Math.min(
              rectHeight,
              +this.options.maxAnnotationHeight,
            );
          }
        }

        if (
          this.options &&
          this.options.colorEncoding === 'itemRgb' &&
          td.fields[8]
        ) {
          const parts = td.fields[8].split(',');

          if (parts.length === 3) {
            const color = `rgb(${td.fields[8]})`;

            fill = color;
          }
        } else if (this.colorValueScale) {
          const rgb = valueToColor(
            this.colorValueScale,
            this.colorScale,
            0, // pseudocounts
            -Number.MIN_VALUE,
          )(+geneInfo[+this.options.colorEncoding - 1]);
          fill = `rgba(${rgb.join(',')})`;
        }

        if (this.valueScale) {
          const value = +geneInfo[+this.options.valueColumn - 1];
          if (value > maxValue) {
            maxValue = value;
          }

          yMiddle = this.valueScale(value);
        }

        const opacity = this.options.fillOpacity || 0.3;
        tile.rectGraphics.lineStyle(1, colorToHex(fill), opacity);
        tile.rectGraphics.beginFill(colorToHex(fill), opacity);

        let rectY = yMiddle - rectHeight / 2;
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
        if (
          !(
            zoomLevel in this.drawnRects && td.uid in this.drawnRects[zoomLevel]
          )
        ) {
          alreadyDrawn = false;

          if (!this.drawnRects[zoomLevel]) this.drawnRects[zoomLevel] = {};

          const drawnPoly = this.drawPoly(
            tile,
            xStartPos,
            xEndPos,
            rectY * this.prevK,
            rectHeight * this.prevK,
            geneInfo[5],
          );

          this.drawnRects[zoomLevel][td.uid] = [
            drawnPoly,
            {
              start: txStart,
              end: txEnd,
              value: td,
              tile,
              fill,
            },
            tile.tileId,
          ];
        }

        if (!this.options.showTexts) continue;

        // tile probably hasn't been initialized yet
        if (!tile.texts) return;

        // don't draw too many texts so they don't bog down the frame rate
        if (i >= (+this.options.maxTexts || MAX_TEXTS)) continue;

        if (!tile.texts[td.uid]) continue;

        const text = tile.texts[td.uid];

        text.position.x = this._xScale(txMiddle);
        text.position.y = rectY + rectHeight / 2;
        text.nominalY = rectY + rectHeight / 2;

        if (alreadyDrawn) {
          text.alreadyDrawn = true;
        }

        const fontColor =
          this.options.fontColor !== undefined
            ? colorToHex(this.options.fontColor)
            : fill;

        text.style = {
          ...TEXT_STYLE,
          fill: fontColor,
          fontSize: +this.options.fontSize || TEXT_STYLE.fontSize,
        };

        if (!(geneInfo[3] in tile.textWidths)) {
          text.updateTransform();
          const textWidth = text.getBounds().width;
          const textHeight = text.getBounds().height;

          // the text size adjustment compensates for the extra
          // size that the show gives it
          const TEXT_SIZE_ADJUSTMENT = 5;

          tile.textWidths[geneInfo[3]] = textWidth;
          tile.textHeights[geneInfo[3]] = textHeight - TEXT_SIZE_ADJUSTMENT;
        }
      }
    }
  }

  renderTile(tile) {
    let maxPlusRows = tile.plusStrandRows ? tile.plusStrandRows.length : 1;
    let maxMinusRows = tile.minusStrandRows ? tile.minusStrandRows.length : 1;

    // const visibleAndFetchedTiles = this.visibleAndFetchedTiles();

    // if (!visibleAndFetchedTiles.length) return;

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
    }

    tile.drawnAtScale = this._xScale.copy();
    tile.rendered = true;

    // configure vertical positioning of annotations if
    // this.options.valueColumn is set
    this.setValueScale();

    // configure coloring of annotations if
    // this.options.colorEncoding is set
    this.setColorValueScale();

    if (tile.tileData && tile.tileData.length) {
      const fill =
        this.options.plusStrandColor || this.options.fillColor || 'blue';
      const minusStrandFill =
        this.options.minusStrandColor || this.options.fillColor || 'purple';

      const MIDDLE_SPACE = 0;
      let plusHeight = 0;

      if (this.options.separatePlusMinusStrands) {
        plusHeight =
          (maxPlusRows * this.dimensions[1]) / (maxPlusRows + maxMinusRows) -
          MIDDLE_SPACE / 2;
      } else {
        plusHeight = this.dimensions[1];
      }

      this.renderRows(
        tile,
        tile.plusStrandRows,
        maxPlusRows,
        0,
        plusHeight,
        fill,
      );
      this.renderRows(
        tile,
        tile.minusStrandRows,
        maxMinusRows,
        this.options.separatePlusMinusStrands
          ? plusHeight + MIDDLE_SPACE / 2
          : 0,
        this.dimensions[1],
        minusStrandFill,
      );
    }

    trackUtils.stretchRects(this, [(x) => x.rectGraphics]);
  }

  calculateZoomLevel() {
    // offset by 2 because 1D tiles are more dense than 2D tiles
    // 1024 points per tile vs 256 for 2D tiles
    const xZoomLevel = tileProxy.calculateZoomLevel(
      this._xScale,
      this.tilesetInfo.min_pos[0],
      this.tilesetInfo.max_pos[0],
    );

    let zoomLevel = Math.min(xZoomLevel, this.maxZoom);
    zoomLevel = Math.max(zoomLevel, 0);

    return zoomLevel;
  }

  minVisibleValueInTiles(valueColumn) {
    let visibleAndFetchedIds = this.visibleAndFetchedIds();

    if (visibleAndFetchedIds.length === 0) {
      visibleAndFetchedIds = Object.keys(this.fetchedTiles);
    }

    let min = Math.min.apply(
      null,
      visibleAndFetchedIds
        .map((x) => this.fetchedTiles[x])
        .filter((x) => x.tileData && x.tileData.length)
        .map((x) =>
          Math.min.apply(
            null,
            x.tileData
              .sort((a, b) => b.importance - a.importance)
              .slice(0, MAX_TILE_ENTRIES)
              .map((y) => +y.fields[valueColumn - 1])
              .filter((y) => !Number.isNaN(y)),
          ),
        ),
    );

    // if there's no data, use null
    if (min === Number.MAX_SAFE_INTEGER) {
      min = null;
    }

    return min;
  }

  maxVisibleValueInTiles(valueColumn) {
    let visibleAndFetchedIds = this.visibleAndFetchedIds();

    if (visibleAndFetchedIds.length === 0) {
      visibleAndFetchedIds = Object.keys(this.fetchedTiles);
    }

    let max = Math.max.apply(
      null,
      visibleAndFetchedIds
        .map((x) => this.fetchedTiles[x])
        .filter((x) => x.tileData && x.tileData.length)
        .map((x) =>
          Math.max.apply(
            null,
            x.tileData
              .sort((a, b) => b.importance - a.importance)
              .slice(0, MAX_TILE_ENTRIES)
              .map((y) => +y.fields[valueColumn - 1])
              .filter((y) => !Number.isNaN(y)),
          ),
        ),
    );

    // if there's no data, use null
    if (max === Number.MIN_SAFE_INTEGER) {
      max = null;
    }

    return max;
  }

  calculateMedianVisibleValue(valueColumn) {
    if (this.areAllVisibleTilesLoaded()) {
      this.allTilesLoaded();
    }

    let visibleAndFetchedIds = this.visibleAndFetchedIds();

    if (visibleAndFetchedIds.length === 0) {
      visibleAndFetchedIds = Object.keys(this.fetchedTiles);
    }

    const values = []
      .concat(
        ...visibleAndFetchedIds
          .map((x) => this.fetchedTiles[x])
          .filter((x) => x.tileData && x.tileData.length)
          .map((x) =>
            x.tileData
              .sort((a, b) => b.importance - a.importance)
              .slice(0, MAX_TILE_ENTRIES)
              .map((y) => +y.fields[valueColumn - 1]),
          ),
      )
      .filter((x) => x > 0);

    this.medianVisibleValue = median(values);
  }

  draw() {
    super.draw();

    this.allTexts = [];
    this.allBoxes = [];

    for (const fetchedTileId in this.fetchedTiles) {
      const tile = this.fetchedTiles[fetchedTileId];

      // these values control vertical scaling and they
      // need to be set in the draw method otherwise when
      // the window is resized, the zoomedY method won't
      // be called
      tile.rectGraphics.scale.y = this.vertK;
      tile.rectGraphics.position.y = this.vertY;

      // hasn't been rendered yet
      if (!tile.drawnAtScale) {
        return;
      }

      trackUtils.stretchRects(this, [(x) => x.rectGraphics]);

      // move the texts

      const parentInFetched = this.parentInFetched(tile);

      if (!tile.initialized) {
        continue;
      }

      if (tile.tileData && tile.tileData.length) {
        tile.tileData.forEach((td) => {
          if (!tile.texts) {
            // tile probably hasn't been initialized yet
            return;
          }

          const geneInfo = td.fields;
          const geneName = geneInfo[3];
          const text = tile.texts[td.uid];

          if (!text) {
            return;
          }

          const chrOffset = +td.chrOffset;
          const txStart = +geneInfo[1] + chrOffset;
          const txEnd = +geneInfo[2] + chrOffset;
          const txMiddle = (txStart + txEnd) / 2;

          text.position.x = this._xScale(txMiddle);
          text.position.y =
            text.nominalY * (this.vertK * this.prevK) + this.vertY;

          if (!parentInFetched && !text.alreadyDrawn) {
            text.visible = true;
            // TODO, change the line below to true if texts are desired in the future
            // text.visible = false;
            const TEXT_MARGIN = 3;
            this.allBoxes.push([
              text.position.x - TEXT_MARGIN,
              text.position.y - tile.textHeights[geneInfo[3]] / 2,
              text.position.x + tile.textWidths[geneInfo[3]] + TEXT_MARGIN,
              text.position.y + tile.textHeights[geneInfo[3]] / 2,
            ]);
            this.allTexts.push({
              importance: td.importance,
              text,
              caption: geneName,
              strand: geneInfo[5],
            });
          } else {
            text.visible = false;
          }
        });
      }
    }

    this.hideOverlaps(this.allBoxes, this.allTexts);
  }

  hideOverlaps(allBoxes, allTexts) {
    // Calculate overlaps from the bounding boxes of the texts

    boxIntersect(allBoxes, (i, j) => {
      if (allTexts[i].importance > allTexts[j].importance) {
        if (allTexts[i].text.visible) {
          allTexts[j].text.visible = false;
        }
      } else if (allTexts[j].text.visible) {
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
    output.setAttribute(
      'transform',
      `translate(${this.position[0]},${this.position[1]})`,
    );

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
        gTile.setAttribute(
          'transform',
          `translate(${tile.rectGraphics.position.x},${tile.rectGraphics.position.y})scale(${tile.rectGraphics.scale.x},${tile.rectGraphics.scale.y})`,
        );
        rectOutput.appendChild(gTile);

        if (
          this.drawnRects[zoomLevel] &&
          td.uid in this.drawnRects[zoomLevel]
        ) {
          const rect = this.drawnRects[zoomLevel][td.uid][0];
          const r = document.createElement('path');
          let d = `M ${rect[0]} ${rect[1]}`;

          for (let i = 2; i < rect.length; i += 2) {
            d += ` L ${rect[i]} ${rect[i + 1]}`;
          }

          const fill = this.drawnRects[zoomLevel][td.uid][1].fill;
          const fontColor =
            this.options.fontColor !== undefined
              ? colorToHex(this.options.fontColor)
              : fill;

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
              `translate(${text.x},${text.y})scale(${text.scale.x},1)`,
            );

            t.setAttribute('text-anchor', 'middle');
            t.setAttribute('font-family', TEXT_STYLE.fontFamily);
            t.setAttribute(
              'font-size',
              +this.options.fontSize || TEXT_STYLE.fontSize,
            );
            t.setAttribute('font-weight', 'bold');
            t.setAttribute('dy', '5px');
            t.setAttribute('fill', fontColor);
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

  /** Move event for the y-axis */
  movedY(dY) {
    Object.values(this.fetchedTiles).forEach((tile) => {
      const vst = this.valueScaleTransform;
      const { y, k } = vst;
      const height = this.dimensions[1];
      // clamp at the bottom and top
      if (y + dY / k > -(k - 1) * height && y + dY / k < 0) {
        this.valueScaleTransform = vst.translate(0, dY / k);
      }
      tile.rectGraphics.position.y = this.valueScaleTransform.y;
      this.vertY = this.valueScaleTransform.y;
    });
    this.animate();
  }

  /** Zoomed along the y-axis */
  zoomedY(yPos, kMultiplier) {
    const newTransform = trackUtils.zoomedY(
      yPos,
      kMultiplier,
      this.valueScaleTransform,
      this.dimensions[1],
    );
    this.valueScaleTransform = newTransform;

    let k1 = newTransform.k;
    const t1 = newTransform.y;

    let toStretch = false;
    k1 /= this.prevK;

    if (k1 > 1.5 || k1 < 1 / 1.5) {
      // this is to make sure that annotations aren't getting
      // too stretched vertically
      this.prevK *= k1;

      k1 = 1;

      toStretch = true;
    }

    this.vertK = k1;
    this.vertY = t1;

    Object.values(this.fetchedTiles).forEach((tile) => {
      if (toStretch) this.renderTile(tile);

      tile.rectGraphics.scale.y = k1;
      tile.rectGraphics.position.y = t1;
    });

    this.draw();
    this.animate();
  }

  getMouseOverHtml(trackX, trackY) {
    if (!this.tilesetInfo) {
      return '';
    }

    const zoomLevel = this.calculateZoomLevel();
    const point = [trackX, trackY];

    if (this.drawnRects[zoomLevel]) {
      const visibleRects = Object.values(this.drawnRects[zoomLevel]);

      for (let i = 0; i < visibleRects.length; i++) {
        const rect = visibleRects[i][0].slice(0);

        // graphics have been scaled so we need to scale the points themselves
        const tileKx = visibleRects[i][1].tile.rectGraphics.scale.x;
        const tilePx = visibleRects[i][1].tile.rectGraphics.position.x;

        const tileKy = visibleRects[i][1].tile.rectGraphics.scale.y;
        const tilePy = visibleRects[i][1].tile.rectGraphics.position.y;

        const newArr = [];

        while (rect.length) {
          const [x, y] = rect.splice(0, 2);
          newArr.push([x * tileKx + tilePx, y * tileKy + tilePy]);
        }

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
