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
  align: 'center',
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

/** Scale a polygon * */
export const polyToPoly = (poly, kx, px, ky, py) => {
  const newArr = [];

  while (poly.length) {
    const [x, y] = poly.splice(0, 2);
    newArr.push([x * kx + px, y * ky + py]);
  }

  return newArr;
};

const hashFunc = function(s) {
  let hash = 0;
  if (s.length === 0) {
    return hash;
  }
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32bit integer
  }
  return hash;
};

const scaleScalableGraphics = (graphics, xScale, drawnAtScale) => {
  const tileK =
    (drawnAtScale.domain()[1] - drawnAtScale.domain()[0]) /
    (xScale.domain()[1] - xScale.domain()[0]);
  const newRange = xScale.domain().map(drawnAtScale);

  const posOffset = newRange[0];
  graphics.scale.x = tileK;
  graphics.position.x = -posOffset * tileK;
};

export const uniqueify = elements => {
  const byUid = {};
  for (let i = 0; i < elements.length; i++) {
    byUid[elements[i].uid] = elements[i];
  }

  return Object.values(byUid);
};

export class TextManager {
  constructor(track) {
    this.track = track;
    this.texts = {};

    // store a list of already created texts so that we don't
    // have to recreate new ones each time
    this.textsList = [];

    this.textWidths = {};
    this.textHeights = {};

    this.textGraphics = new GLOBALS.PIXI.Graphics();
    this.track.pMain.addChild(this.textGraphics);
  }

  hideOverlaps() {
    const [allBoxes, allTexts] = [this.allBoxes, this.allTexts];
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

  startDraw() {
    this.allBoxes = [];
    this.allTexts = [];
  }

  lightUpdateSingleText(td, xMiddle, yMiddle, textInfo) {
    if (!this.texts[td.uid]) return;
    if (!this.track.options.showTexts) return;

    const text = this.texts[td.uid];

    const TEXT_MARGIN = 3;

    text.position.x = xMiddle;
    text.position.y = yMiddle;

    text.visible = true;
    this.allBoxes.push([
      text.position.x - TEXT_MARGIN,
      text.position.y - this.textHeights[td.uid] / 2,
      text.position.x + this.textWidths[td.uid] + TEXT_MARGIN,
      text.position.y + this.textHeights[td.uid] / 2,
    ]);

    this.allTexts.push({
      text,
      ...textInfo,
    });
  }

  updateSingleText(td, xMiddle, yMiddle, textText) {
    if (!this.texts[td.uid]) return;

    const text = this.texts[td.uid];

    text.position.x = xMiddle;
    text.position.y = yMiddle;
    text.nominalY = yMiddle;

    const fontColor =
      this.track.options.fontColor !== undefined
        ? colorToHex(this.track.options.fontColor)
        : 'black';

    text.style = {
      ...TEXT_STYLE,
      fill: fontColor,
      fontSize: +this.track.options.fontSize || TEXT_STYLE.fontSize,
    };
    text.text = textText;

    if (!(td.uid in this.textWidths)) {
      text.updateTransform();
      const textWidth = text.getBounds().width;
      const textHeight = text.getBounds().height;

      // the text size adjustment compensates for the extra
      // size that the show gives it
      const TEXT_SIZE_ADJUSTMENT = 5;

      this.textWidths[td.uid] = textWidth;
      this.textHeights[td.uid] = textHeight - TEXT_SIZE_ADJUSTMENT;
    }
  }

  updateTexts() {
    if (this.track.options.showTexts) {
      this.texts = {};

      let yRange = [
        (0 - this.track.vertY) / (this.track.vertK * this.track.prevK),
        (this.track.dimensions[1] - this.track.vertY) /
          (this.track.vertK * this.track.prevK),
      ];

      const yRangeWidth = yRange[1] - yRange[0];
      yRange = [yRange[0] - yRangeWidth * 0.8, yRange[1] + yRangeWidth * 0.8];

      const relevantSegments = this.track.uniqueSegments.filter(
        x => !x.yMiddle || (x.yMiddle > yRange[0] && x.yMiddle < yRange[1]),
      );

      relevantSegments.forEach((td, i) => {
        // don't draw too many texts so they don't bog down the frame rate
        if (i >= (+this.track.options.maxTexts || MAX_TEXTS)) {
          return;
        }

        let text = this.textsList[i];

        if (!text) {
          text = new GLOBALS.PIXI.Text();
          this.textsList.push(text);
          this.textGraphics.addChild(text);
        }

        text.style = {
          ...TEXT_STYLE,
          fontSize: +this.track.options.fontSize || TEXT_STYLE.fontSize,
        };

        // geneInfo[3] is the gene symbol

        if (this.track.isLeftModified) {
          text.scale.x = -1;
        }

        text.anchor.x = 0.5;
        text.anchor.y = 0.5;

        this.texts[td.uid] = text;
      });

      while (
        this.textsList.length >
        Math.min(
          relevantSegments.length,
          +this.track.options.maxTexts || MAX_TEXTS,
        )
      ) {
        const text = this.textsList.pop();
        this.textGraphics.removeChild(text);
      }
    }
  }
}

class BedLikeTrack extends HorizontalTiled1DPixiTrack {
  constructor(context, options) {
    super(context, options);

    this.valueScaleTransform = zoomIdentity;

    this.textManager = new TextManager(this);

    this.vertY = 1;
    this.vertK = 0;
    this.prevY = 0;
    this.prevK = 1;

    // we're setting these functions to null so that value scale
    // locking doesn't try to get values from them
    this.minRawValue = null;
    this.maxRawValue = null;

    this.rectGraphics = new GLOBALS.PIXI.Graphics();
    this.pMain.addChild(this.rectGraphics);

    this.selectedRect = null;

    this.uniqueSegments = [];
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

  updateExistingGraphics() {
    const errors = this._checkForErrors();

    let plusStrandRows = [];
    let minusStrandRows = [];

    if (errors.length > 0) {
      this.draw();
      return;
    }

    this.uniqueSegments = uniqueify(
      Object.values(this.fetchedTiles)
        .map(x => x.tileData)
        .flat(),
    );

    this.uniqueSegments.forEach(td => {
      // A random importance helps with selective hiding
      // of overlapping texts
      if (!td.importance) {
        td.importance = hashFunc(td.uid.toString());
      }
    });

    this.uniqueSegments.sort((a, b) => b.importance - a.importance);

    if (!this.options || !this.options.valueColumn) {
      // no value column so we can break entries up into separate
      // plus and minus strand segments
      const segments = this.uniqueSegments.map(x => {
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
      plusStrandRows = [this.uniqueSegments.map(x => ({ value: x }))];
    }

    this.plusStrandRows = plusStrandRows;
    this.minusStrandRows = minusStrandRows;

    this.textManager.updateTexts();
    this.render();
  }

  selectRect(uid) {
    this.selectedRect = uid;

    this.render();
    this.animate();
  }

  /** There was a click outside the track so unselect the
   * the current selection */
  clickOutside() {
    this.selectRect(null);
  }

  initTile(tile) {}

  /**
   * Remove the tile's rectangles from the list of drawnRects so that they
   * can be drawn again.
   */
  // removeTileRects(tile) {
  //   const zoomLevel = +tile.tileId.split('.')[0];
  //   tile.rectGraphics.clear();
  //   tile.rendered = false;

  //   if (tile.tileData && tile.tileData.length) {
  //     tile.tileData.forEach((td, i) => {
  //       if (this.drawnRects[zoomLevel] && this.drawnRects[zoomLevel][td.uid]) {
  //         if (this.drawnRects[zoomLevel][td.uid][2] === tile.tileId) {
  //           // this was the tile that drew that rectangle
  //           delete this.drawnRects[zoomLevel][td.uid];
  //         }
  //       }
  //     });
  //   }
  // }

  destroyTile(tile) {}

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

    this.updateExistingGraphics();
  }

  updateTile(tile) {
    // this.destroyTile(tile);
    // if (this.areAllVisibleTilesLoaded()) {
    //   this.destroyTile(tile);
    //   this.initTile(tile);
    //   this.renderTile(tile);
    // }
  }

  /**
   * Use this only when there's one row
   *
   * @return {[type]} [description]
   */
  allVisibleRects() {
    const allRects = {};

    Object.values(this.fetchedTiles).forEach(x => {
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

  drawSegmentStyle(xStartPos, xEndPos, rectY, rectHeight, strand) {
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

    this.rectGraphics.drawPolygon(poly);
    return poly;
  }

  drawPoly(xStartPos, xEndPos, rectY, rectHeight, strand) {
    let drawnPoly = null;

    if (this.options.annotationStyle === 'segment') {
      return this.drawSegmentStyle(
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
        this.rectGraphics.drawPolygon(drawnPoly);
      } else {
        drawnPoly = [
          xEndPos,
          rectY, // top
          xEndPos - rectHeight / 2,
          rectY + rectHeight / 2, // left point
          xEndPos,
          rectY + rectHeight, // bottom
        ];
        this.rectGraphics.drawPolygon(drawnPoly);
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

      this.rectGraphics.drawPolygon(drawnPoly);
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

      this.colorValueScale = scaleLinear()
        .domain([min, max])
        .range([0, 255]);
    }
  }

  renderRows(rows, maxRows, startY, endY, fill) {
    let maxValue = Number.MIN_SAFE_INTEGER;

    this.initialize();

    const rowScale = scaleBand()
      .domain(range(maxRows))
      .range([startY, endY]);
    // .paddingOuter(0.2);
    // .paddingInner(0.3)

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

        const txStart = +td.xStart;
        const txEnd = +td.xEnd;
        const txMiddle = (txStart + txEnd) / 2;
        let yMiddle = rowScale(j) + rowScale.bandwidth() / 2;

        let rectHeight = this.options.annotationHeight || 'scaled';

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
          let parts = [];

          try {
            parts = td.fields[8].split(',');
            // eslint-disable-next-line
          } catch {}

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
        } else if (
          this.options &&
          this.options.colorEncoding === 'itemRgb' &&
          td.fields[8]
        ) {
          const parts = td.fields[8].split(',');

          if (parts.length === 3) {
            const color = `rgb(${td.fields[8]})`;

            fill = color;
          }
        }

        if (this.valueScale) {
          const value = +geneInfo[+this.options.valueColumn - 1];
          if (value > maxValue) {
            maxValue = value;
          }
          yMiddle = this.valueScale(value);
        }

        const opacity = this.options.fillOpacity || 0.3;

        if (this.selectedRect === td.uid) {
          this.rectGraphics.lineStyle(3, 0, 0.75);
        } else {
          this.rectGraphics.lineStyle(1, colorToHex(fill), opacity);
        }

        this.rectGraphics.beginFill(colorToHex(fill), opacity);

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
        const drawnPoly = this.drawPoly(
          xStartPos,
          xEndPos,
          rectY * this.prevK,
          rectHeight * this.prevK,
          geneInfo[5],
        );

        this.drawnRects[td.uid] = [
          drawnPoly,
          {
            start: txStart,
            end: txEnd,
            value: td,
            fill,
          },
        ];

        td.yMiddle = yMiddle;

        if (!this.options.showTexts) {
          continue;
        }

        // don't draw too many texts so they don't bog down the frame rate
        if (i >= (+this.options.maxTexts || MAX_TEXTS)) continue;

        this.textManager.updateSingleText(
          td,
          this._xScale(txMiddle),
          rectY + rectHeight / 2,
          td.fields[3],
        );
      }
    }

    this.textManager.updateTexts();
  }

  render() {
    const maxPlusRows = this.plusStrandRows ? this.plusStrandRows.length : 1;
    const maxMinusRows = this.minusStrandRows ? this.minusStrandRows.length : 1;

    this.prevVertY = this.vertY;

    const oldRectGraphics = this.rectGraphics;
    this.rectGraphics = new GLOBALS.PIXI.Graphics();

    // store the scale at while the tile was drawn at so that
    // we only resize it when redrawing

    this.drawnAtScale = this._xScale.copy();
    // configure vertical positioning of annotations if
    // this.options.valueColumn is set
    this.setValueScale();

    // configure coloring of annotations if
    // this.options.colorEncoding is set
    this.setColorValueScale();

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

    this.renderRows(this.plusStrandRows, maxPlusRows, 0, plusHeight, fill);
    this.renderRows(
      this.minusStrandRows,
      maxMinusRows,
      this.options.separatePlusMinusStrands ? plusHeight + MIDDLE_SPACE / 2 : 0,
      this.dimensions[1],
      minusStrandFill,
    );

    this.pMain.removeChild(oldRectGraphics);
    // this.pMain.removeChild(oldTextGraphics);

    this.pMain.addChild(this.rectGraphics);
    // this.pMain.addChild(this.textGraphics);

    scaleScalableGraphics(this.rectGraphics, this._xScale, this.drawnAtScale);
    // scaleScalableGraphics(this.textGraphics, this._xScale, this.drawnAtScale);
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
        .map(x => this.fetchedTiles[x])
        .filter(x => x.tileData && x.tileData.length)
        .map(x =>
          Math.min.apply(
            null,
            x.tileData
              .sort((a, b) => b.importance - a.importance)
              .slice(0, MAX_TILE_ENTRIES)
              .map(y => +y.fields[valueColumn - 1])
              .filter(y => !Number.isNaN(y)),
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
        .map(x => this.fetchedTiles[x])
        .filter(x => x.tileData && x.tileData.length)
        .map(x =>
          Math.max.apply(
            null,
            x.tileData
              .sort((a, b) => b.importance - a.importance)
              .slice(0, MAX_TILE_ENTRIES)
              .map(y => +y.fields[valueColumn - 1])
              .filter(y => !Number.isNaN(y)),
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
          .map(x => this.fetchedTiles[x])
          .filter(x => x.tileData && x.tileData.length)
          .map(x =>
            x.tileData
              .sort((a, b) => b.importance - a.importance)
              .slice(0, MAX_TILE_ENTRIES)
              .map(y => +y.fields[valueColumn - 1]),
          ),
      )
      .filter(x => x > 0);

    this.medianVisibleValue = median(values);
  }

  draw() {
    super.draw();

    this.textManager.startDraw();

    // these values control vertical scaling and they
    // need to be set in the draw method otherwise when
    // the window is resized, the zoomedY method won't
    // be called
    this.rectGraphics.scale.y = this.vertK;
    this.rectGraphics.position.y = this.vertY;

    // hasn't been rendered yet
    if (!this.drawnAtScale) {
      return;
    }

    scaleScalableGraphics(this.rectGraphics, this._xScale, this.drawnAtScale);
    // scaleScalableGraphics(this.textGraphics, this._xScale, this.drawnAtScale);

    if (this.uniqueSegments && this.uniqueSegments.length) {
      this.uniqueSegments.forEach(td => {
        const geneInfo = td.fields;
        const geneName = geneInfo[3];

        const xMiddle = this._xScale((td.xStart + td.xEnd) / 2);
        if (this.textManager.texts[td.uid]) {
          const yMiddle =
            this.textManager.texts[td.uid].nominalY *
              (this.vertK * this.prevK) +
            this.vertY;

          this.textManager.lightUpdateSingleText(td, xMiddle, yMiddle, {
            importance: td.importance,
            caption: geneName,
            strand: geneInfo[5],
          });
        }
      });
    }

    this.textManager.hideOverlaps();
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

    this.uniqueSegments.forEach(td => {
      const gTile = document.createElement('g');
      gTile.setAttribute(
        'transform',
        `translate(${this.rectGraphics.position.x},${this.rectGraphics.position.y})scale(${this.rectGraphics.scale.x},${this.rectGraphics.scale.y})`,
      );
      rectOutput.appendChild(gTile);

      if (this.drawnRects && td.uid in this.drawnRects) {
        const rect = this.drawnRects[td.uid][0];
        const r = document.createElement('path');

        let d = `M ${rect[0]} ${rect[1]}`;

        for (let i = 2; i < rect.length; i += 2) {
          d += ` L ${rect[i]} ${rect[i + 1]}`;
        }

        const fill = this.drawnRects[td.uid][1].fill;
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

        if (this.textManager.texts[td.uid]) {
          const text = this.textManager.texts[td.uid];

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

    return [base, base];
  }

  /** Move event for the y-axis */
  movedY(dY) {
    const vst = this.valueScaleTransform;
    const { y, k } = vst;
    const height = this.dimensions[1];
    // clamp at the bottom and top
    if (y + dY / k > -(k - 1) * height && y + dY / k < 0) {
      this.valueScaleTransform = vst.translate(0, dY / k);
    }
    this.rectGraphics.position.y = this.valueScaleTransform.y;
    this.vertY = this.valueScaleTransform.y;
    this.animate();

    if (this.vertY - this.prevVertY > this.dimensions[1] / 2) {
      this.render();
    }
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

    if (toStretch) {
      this.render();
    }
    this.rectGraphics.scale.y = k1;
    this.rectGraphics.position.y = t1;

    // this.textGraphics.scale.y = k1;
    // this.textGraphics.position.y = t1;
    this.draw();
    this.animate();
  }

  getMouseOverHtml(trackX, trackY) {
    if (!this.tilesetInfo) {
      return '';
    }

    if (!this.drawnRects) {
      return '';
    }

    const closestText = '';
    const point = [trackX, trackY];

    const visibleRects = Object.values(this.drawnRects);

    for (let i = 0; i < visibleRects.length; i++) {
      const rect = visibleRects[i][0].slice(0);

      const newArr = polyToPoly(
        rect,
        this.rectGraphics.scale.x,
        this.rectGraphics.position.x,
        this.rectGraphics.scale.y,
        this.rectGraphics.position.y,
      );

      const pc = classifyPoint(newArr, point);

      if (pc === -1) {
        const parts = visibleRects[i][1].value.fields;

        return parts.join(' ');
      }
    }

    return closestText;
  }
}

export default BedLikeTrack;
