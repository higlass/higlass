import boxIntersect from 'box-intersect';
import * as PIXI from 'pixi.js';

// Components
import HorizontalTiled1DPixiTrack from './HorizontalTiled1DPixiTrack';

// Services
import { tileProxy } from './services';

// Utils
import { colorToHex } from './utils';

const FONT_SIZE = 11;
const FONT_FAMILY = 'Arial';
const GENE_LABEL_POS = 'outside';
const GENE_RECT_WIDTH = 1;
const GENE_RECT_HEIGHT = 10;
const GENE_STRAND_SPACING = 4;
const TRIANGLE_HEIGHT = 6;
const MAX_TEXTS = 100;
const WHITE_HEX = colorToHex('#ffffff');
const EXON_LINE_HEIGHT = 1;
const MIN_SCORE_CUTOFF_FOR_FILL_OPACITY = 500;
const DEFAULT_ITEM_RGB_NAME = 'Unknown';

class HorizontalGeneBED12AnnotationsTrack extends HorizontalTiled1DPixiTrack {
  /**
   * Create a new track for BED12-formatted Gene Annotations
   *
   * Arguments:
   * ----------
   *  scene: PIXI.js scene (or graphics)
   *      Where to draw everything.
   *  dataConfig: object
   *      Holds the server and tileset UID
   *  handleTilesetInfoReceived: function
   *      A callback to let the caller know that we've received the
   *      tileset information for this track.
   *  options: {}
   *      An object containing all of the options that describe how this track should
   *      be rendered
   *  animate: callback
   *      Function to be called when something in this track changes.
   */
  constructor(context, options) {
    super(context, options);
    const { animate } = context;

    this.animate = animate;
    this.options = options;

    this.drawnGenes = {};

    this.fontSize = +this.options.fontSize || FONT_SIZE;
    this.geneLabelPos = this.options.geneLabelPosition || GENE_LABEL_POS;
    this.geneRectHeight = +this.options.geneAnnotationHeight || GENE_RECT_HEIGHT;

    // Don't ask me why but rectangles and triangles seem to be drawn 2px larger
    // than they should be
    this.geneRectHeight -= 2;

    this.geneTriangleHeight = 0.6 * this.geneRectHeight || TRIANGLE_HEIGHT;
    this.geneStrandSpacing = +this.options.geneStrandSpacing || GENE_STRAND_SPACING;
    this.geneStrandHSpacing = this.geneStrandSpacing / 2;
    this.geneRectHHeight = this.geneRectHeight / 2;

    this.nextTxStart = -1;
    this.pushElementToNextRow = false;
  }

  initTile(tile) {
    // create texts
    tile.texts = {};

    tile.rectGraphics = new PIXI.Graphics();
    tile.textBgGraphics = new PIXI.Graphics();
    tile.textGraphics = new PIXI.Graphics();

    tile.graphics.addChild(tile.rectGraphics);
    tile.graphics.addChild(tile.textBgGraphics);
    tile.graphics.addChild(tile.textGraphics);

    tile.tileData.forEach((td, i) => {
      if (!Array.isArray(td.fields)) return;

      const geneInfo = td.fields;
      const geneName = geneInfo[3];
      const geneId = this.geneId(geneInfo);

      const fillTriplet = geneInfo[8].split(',');
      const fill = PIXI.utils.rgb2hex([fillTriplet[0] / 255.0,
        fillTriplet[1] / 255.0,
        fillTriplet[2] / 255.0]);

      tile.textWidths = {};
      tile.textHeights = {};
      tile.textYMiddles = {};
      tile.xScaledStarts = {};
      tile.xScaledEnds = {};
      tile.yScaledStarts = {};
      tile.yScaledEnds = {};

      // don't draw texts for the latter entries in the tile
      if (i >= MAX_TEXTS) return;

      const text = new PIXI.Text(
        geneName,
        {
          fontSize: `${this.fontSize}px`,
          fontFamily: FONT_FAMILY,
          fill
        }
      );
      text.interactive = true;

      if (this.flipText) text.scale.x = -1;

      text.anchor.x = 0.5;
      text.anchor.y = 1;

      tile.texts[geneId] = text; // index by geneName

      tile.textGraphics.addChild(text);
    });

    tile.initialized = true;

    this.renderTile(tile);
  }

  destroyTile(tile) {
    const zoomLevel = +tile.tileId.split('.')[0];
    const tiles = this.visibleAndFetchedTiles();
    const tileIds = {};
    tiles.forEach((t) => { tileIds[t.tileId] = t; });

    if (tile.tileData && tile.tileData.filter && this.drawnGenes[zoomLevel]) {
      tile.tileData
        .filter(td => this.drawnGenes[zoomLevel][td.fields[3]])
        .forEach((td) => {
          const gene = td.fields[3];
          // We might need to rerender because we're about to remove a tile, which can
          // contain gene annotations stretching multiple tiles. By removing this tile
          // the annotation visualization will be gone but the other tiles might still
          // contain its data.
          if (this.drawnGenes[zoomLevel][gene]) {
            const reRender = Object.keys(this.drawnGenes[zoomLevel][gene].otherTileIds)
              .some((tileId) => {
                if (tileIds[tileId]) {
                  this.drawnGenes[zoomLevel][gene].otherTileIds[tileId] = undefined;
                  delete this.drawnGenes[zoomLevel][gene].otherTileIds[tileId];
                  this.drawnGenes[zoomLevel][gene].tileId = tileId;
                  this.renderTile(tileIds[tileId]);
                  return true;
                }
                return false;
              });
            if (!reRender) this.drawnGenes[zoomLevel][gene] = undefined;
          }
        });
    }
  }

  /*
   * Redraw the track because the options
   * changed
   */
  rerender(options, force) {
    const strOptions = JSON.stringify(options);
    if (!force && strOptions === this.prevOptions) return;

    super.rerender(options, force);

    this.fontSize = +this.options.fontSize || FONT_SIZE;
    this.geneLabelPos = this.options.geneLabelPosition || GENE_LABEL_POS;
    this.geneRectHeight = +this.options.geneAnnotationHeight || GENE_RECT_HEIGHT;
    this.geneTriangleHeight = 0.6 * this.geneRectHeight || TRIANGLE_HEIGHT;
    this.geneStrandHSpacing = this.geneStrandSpacing / 2;
    this.geneRectHHeight = this.geneRectHeight / 2;

    this.prevOptions = strOptions;

    this.visibleAndFetchedTiles().forEach((tile) => {
      this.renderTile(tile);
    });
  }

  drawTile() {}

  geneId(geneInfo) {
    return `${geneInfo[0]}_${geneInfo[1]}_${geneInfo[2]}_${geneInfo[3]}`;
  }

  renderTile(tile) {
    if (!tile.initialized) return;

    tile.allRects = [];

    /*
    const tileWidth = tileProxy.calculateTileWidth(
      this.tilesetInfo, zoomLevel, this.tilesetInfo.tile_size
    );
*/

    // store the scale at while the tile was drawn at so that
    // we only resize it when redrawing
    tile.drawnAtScale = this._xScale.copy();
    tile.rectGraphics.clear();
    tile.textBgGraphics.clear();

    const zoomLevel = +tile.tileId.split('.')[0];

    const filteredTiles = tile.tileData
      .filter((td) => {
        if (!this.drawnGenes[zoomLevel]) this.drawnGenes[zoomLevel] = {};

        const gene = td.fields[3];

        if (!this.drawnGenes[zoomLevel][gene]) {
          this.drawnGenes[zoomLevel][gene] = {
            tileId: tile.tileId,
            otherTileIds: {},
          };
          return true;
        }

        if (this.drawnGenes[zoomLevel][gene].tileId !== tile.tileId) {
          this.drawnGenes[zoomLevel][gene].otherTileIds[tile.tileId] = true;
        }

        return (
          !this.drawnGenes[zoomLevel][td.fields[3]]
          || this.drawnGenes[zoomLevel][td.fields[3]].tileId === tile.tileId
        );
      });

    // console.log("filteredTiles length", filteredTiles.length);

    const lastIndex = filteredTiles.length - 1;

    filteredTiles.forEach((td, i) => {
      const geneInfo = td.fields;
      // the returned positions are chromosome-based and they need to
      // be converted to genome-based
      const chrOffset = +td.chrOffset;
      const txStart = +geneInfo[1] + chrOffset;
      const txEnd = +geneInfo[2] + chrOffset;
      const thickStart = +geneInfo[6] + chrOffset;
      const thickEnd = +geneInfo[7] + chrOffset;
      const blockSizes = geneInfo[10];
      const blockStarts = geneInfo[11];

      const txMiddle = (txStart + txEnd) / 2;
      let yMiddle = this.dimensions[1] / 2;
      const geneId = this.geneId(geneInfo);

      const fillTriplet = geneInfo[8].split(',');
      const fill = PIXI.utils.rgb2hex([fillTriplet[0] / 255.0,
        fillTriplet[1] / 255.0,
        fillTriplet[2] / 255.0]);
      const score = +geneInfo[4];
      const fillOpacity = ((score < MIN_SCORE_CUTOFF_FOR_FILL_OPACITY)
        ? MIN_SCORE_CUTOFF_FOR_FILL_OPACITY
        : score) / 1000.0;

      // flip row flag, if there is an overlap between the current and next elements

      if (i < lastIndex) {
        const nextTile = filteredTiles[i + 1];
        this.nextTxStart = +nextTile.fields[1] + nextTile.chrOffset;
        if ((this.nextTxStart < txEnd) || (!this.pushElementToNextRow)) {
          this.pushElementToNextRow = !this.pushElementToNextRow;
        }
      } else if ((i === 0) && (this.nextTxStart !== -1)) {
        const nextTileCompetitor = filteredTiles[i + 1];
        if (nextTileCompetitor) {
          const nextTxStartCompetitor = +nextTileCompetitor.fields[1]
              + nextTileCompetitor.chrOffset;
          this.nextTxStart = (nextTxStartCompetitor > this.nextTxStart)
            ? this.nextTxStart
            : nextTxStartCompetitor;
          if ((this.nextTxStart < txEnd) || (!this.pushElementToNextRow)) {
            this.pushElementToNextRow = !this.pushElementToNextRow;
          }
        }
      } else {
        this.nextTxStart = txEnd;
        this.pushElementToNextRow = !this.pushElementToNextRow;
      }
      yMiddle += (this.pushElementToNextRow) ? (+this.geneRectHeight * 1.25) : 0;
      tile.textYMiddles[geneId] = (!this.pushElementToNextRow)
        ? (this.dimensions[1] / 2) - (this.geneRectHeight * 0.125) + -this.geneRectHeight
        : yMiddle + (this.geneRectHeight * 2.5);

      tile.rectGraphics.beginFill(fill, fillOpacity);

      const rectX = this._xScale(txMiddle) - (GENE_RECT_WIDTH / 2);
      const rectY = yMiddle - this.geneRectHHeight + (EXON_LINE_HEIGHT / 2);

      const xStartPos = this._xScale(txStart);
      const xEndPos = this._xScale(txEnd);

      /*
        td.xStart = txStart;
        td.xEnd = txEnd;
*/

      const MIN_SIZE_FOR_EXONS = 3;

      if (xEndPos - xStartPos > MIN_SIZE_FOR_EXONS) {
        if (geneInfo.length < 12) {
          // don't draw if the input is invalid
          console.warn(
            'Gene annotations have less than 12 columns (chrName, chrStart, chrEnd, '
              + 'name, score, strand, thickStart, thickEnd, itemRgb, '
              + 'blockCount, blockSizes, blockStarts):',
            geneInfo
          );
        } else {
          tile.allRects = tile.allRects.concat(
            this.drawBlocks(
              tile.rectGraphics,
              txStart,
              txEnd,
              thickStart,
              thickEnd,
              blockStarts,
              blockSizes,
              chrOffset,
              yMiddle,
              geneInfo[5],
              fill,
              fillOpacity
            ).map(x => [x, geneInfo[5]])
          );
        }
      } else {
        let poly = [];

        if (geneInfo[5] === '+') {
          poly = [
            rectX, yMiddle,
            rectX + (this.geneRectHeight / 2), yMiddle + (this.geneRectHeight / 2),
            rectX, yMiddle + this.geneRectHeight
          ];
        } else if (geneInfo[5] === '-') {
          poly = [
            rectX, yMiddle,
            rectX - (this.geneRectHeight / 2), yMiddle + (this.geneRectHeight / 2),
            rectX, yMiddle + this.geneRectHeight
          ];
        } else {
          poly = [
            rectX, rectY,
            rectX - (this.geneRectHeight / 2), rectY,
            rectX - (this.geneRectHeight / 2), rectY + this.geneRectHeight,
            rectX, rectY + this.geneRectHeight
          ];
        }
        tile.rectGraphics.drawPolygon(poly);

        tile.allRects.push([poly, geneInfo[5]]);
      }

      // tile probably hasn't been initialized yet
      if (!tile.texts) return;

      // don't draw texts for the latter entries in the tile
      if (i >= MAX_TEXTS) return;

      const text = tile.texts[geneId];

      if (!text) return;

      text.style = {
        fontSize: `${this.fontSize}px`,
        fontFamily: FONT_FAMILY,
        fill
      };

      text.alpha = fillOpacity;

      if (!(geneId in tile.textWidths)) {
        text.updateTransform();
        const textWidth = text.getBounds().width;
        const textHeight = text.getBounds().height;

        tile.textWidths[geneId] = textWidth;
        tile.textHeights[geneId] = textHeight;
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

  drawBlocks(
    graphics,
    txStart,
    txEnd,
    thickStart,
    thickEnd,
    blockStarts,
    blockSizes,
    chrOffset,
    yMiddle,
    strand,
    fill,
    fillOpacity
  ) {
    const blockOffsetStarts = blockStarts.split(',').map(x => +x + txStart);
    const blockOffsetEnds = blockSizes.split(',').map((x, i) => +x + blockOffsetStarts[i]);

    const xStartPos = this._xScale(txStart);
    const xEndPos = this._xScale(txEnd);

    const lineHeight = EXON_LINE_HEIGHT;
    const lineHHeight = lineHeight / 2;
    const exonHeight = this.geneRectHeight;
    const width = xEndPos - xStartPos;

    /*
    const yPos = strand === '+'
      ? this.halfRectHHeight - this.geneStrandHSpacing - this.geneRectHHeight - lineHHeight
      : this.halfRectHHeight + this.geneStrandHSpacing + this.geneRectHHeight - lineHHeight;
*/
    const yPos = yMiddle;

    const yExonPos = yPos - this.geneRectHHeight + lineHHeight;

    const polys = [];
    let poly = [
      xStartPos, yPos,
      xStartPos + width, yPos,
      xStartPos + width, yPos + lineHeight,
      xStartPos, yPos + lineHeight
    ];

    graphics.drawPolygon(poly);

    // Draw the middle line
    polys.push([
      xStartPos, yPos,
      xStartPos + width, yPos,
      xStartPos + width, yPos + lineHeight,
      xStartPos, yPos + lineHeight
    ]);

    // We only render directionality cues if the strand column explicitly contains that information
    if ((strand === '+') || (strand === '-')) {
      for (
        let j = Math.max(this.position[0], xStartPos);
        j < Math.min(this.position[0] + this.dimensions[0], xStartPos + width);
        j += 2 * this.geneRectHeight
      ) {
        if (strand === '+') {
          poly = [
            j, yExonPos + ((this.geneRectHeight - this.geneTriangleHeight) / 2),
            j + (this.geneTriangleHeight / 2), yExonPos + (this.geneRectHeight / 2),
            j, yExonPos + ((this.geneRectHeight + this.geneTriangleHeight) / 2)
          ];
        } else if (strand === '-') {
          poly = [
            j, yExonPos + ((this.geneRectHeight - this.geneTriangleHeight) / 2),
            j - (this.geneTriangleHeight / 2), yExonPos + (this.geneRectHeight / 2),
            j, yExonPos + ((this.geneRectHeight + this.geneTriangleHeight) / 2)
          ];
        }

        polys.push(poly);
        graphics.drawPolygon(poly);
      }
    }

    // Exon blocks
    for (let j = 0; j < blockOffsetStarts.length; j++) {
      const blockStart = blockOffsetStarts[j];
      const blockEnd = blockOffsetEnds[j];

      const xStart = this._xScale(blockStart);
      const localWidth = Math.max(1, this._xScale(blockEnd) - this._xScale(blockStart));
      const height = exonHeight;

      const localPoly = [
        xStart, yExonPos,
        xStart + localWidth, yExonPos,
        xStart + localWidth, yExonPos + height,
        xStart, yExonPos + height,
        xStart, yExonPos,
      ];

      polys.push(localPoly);
      graphics.drawPolygon(localPoly);
    }

    // Thick block
    // graphics.beginFill(fill, fillOpacity);
    const thickHeight = this.geneRectHHeight * 2;
    const thickWidth = Math.max(1, this._xScale(thickEnd) - this._xScale(thickStart));
    const thickXStart = this._xScale(thickStart);
    const thickYStart = yPos - thickHeight;
    const thickPoly = [
      thickXStart, thickYStart,
      thickXStart + thickWidth, thickYStart,
      thickXStart + thickWidth, thickYStart + (2 * thickHeight),
      thickXStart, thickYStart + (2 * thickHeight),
      thickXStart, thickYStart,
    ];
    // console.log("thickPoly", thickPoly);
    polys.push(thickPoly);
    graphics.drawPolygon(thickPoly);

    return polys;
  }

  draw() {
    super.draw();

    this.allTexts = [];
    this.allBoxes = [];
    const allTiles = [];

    const fontSizeHalf = this.fontSize / 2;

    // go through once to make sure the tiles aren't being
    // excessively stretched
    Object.values(this.fetchedTiles)
      // tile hasn't been drawn properly because we likely got some
      // bogus data from the server
      .filter((tile) => {
        if (!tile.drawnAtScale) return false;

        const tileK = (
          (tile.drawnAtScale.domain()[1] - tile.drawnAtScale.domain()[0])
          / (this._xScale.domain()[1] - this._xScale.domain()[0])
        );

        return tileK > 3;
      })
      .forEach((tile) => {
        this.renderTile(tile);
      });

    Object.values(this.fetchedTiles)
      // tile hasn't been drawn properly because we likely got some
      // bogus data from the server
      .filter(tile => tile.drawnAtScale)
      .forEach((tile) => {
        const tileK = (
          (tile.drawnAtScale.domain()[1] - tile.drawnAtScale.domain()[0])
          / (this._xScale.domain()[1] - this._xScale.domain()[0])
        );
        const newRange = this._xScale.domain().map(tile.drawnAtScale);

        const posOffset = newRange[0];
        tile.rectGraphics.scale.x = tileK;
        tile.rectGraphics.position.x = -posOffset * tileK;

        tile.textBgGraphics.clear();
        tile.textBgGraphics.beginFill(
          typeof this.options.labelBackgroundColor !== 'undefined'
            ? colorToHex(this.options.labelBackgroundColor)
            : WHITE_HEX
        );

        // move the texts
        const parentInFetched = this.parentInFetched(tile);

        if (!tile.initialized) return;

        tile.tileData.forEach((td, i) => {
          // tile probably hasn't been initialized yet
          if (!tile.texts) return;

          // console.log(`draw, tileData: ${i}`);

          const geneInfo = td.fields;
          const geneName = geneInfo[3];
          const geneId = this.geneId(geneInfo);

          const text = tile.texts[geneId];

          if (!text) return;

          const chrOffset = +td.chrOffset;
          const txStart = +geneInfo[1] + chrOffset;
          const txEnd = +geneInfo[2] + chrOffset;
          const txMiddle = (txStart + txEnd) / 2;
          const thickXStart = +geneInfo[6] + chrOffset;
          const thickXEnd = +geneInfo[7] + chrOffset;
          const thickXMiddle = (thickXStart + thickXEnd) / 2;
          const textYMiddle = tile.textYMiddles[geneId];

          tile.xScaledStarts[geneId] = Math.floor(this._xScale(txStart));
          tile.xScaledEnds[geneId] = Math.ceil(this._xScale(txEnd));

          text.position.x = (thickXMiddle !== 0)
            ? this._xScale(thickXMiddle)
            : this._xScale(txMiddle);
          text.position.y = textYMiddle;

          if (!tile.textWidths[geneId]) {
            // if we haven't measured the text's width in renderTile, do it now
            // this can occur if the same gene is in more than one tile, so its
            // dimensions are measured for the first tile and not for the second
            const textWidth = text.getBounds().width;
            const textHeight = text.getBounds().height;

            tile.textHeights[geneId] = textHeight;
            tile.textWidths[geneId] = textWidth;
          }

          tile.yScaledStarts[geneId] = (textYMiddle < (this.dimensions[1] / 2))
            ? textYMiddle - tile.textHeights[geneId]
            : textYMiddle - tile.textHeights[geneId] - (this.geneRectHeight * 2);

          tile.yScaledEnds[geneId] = (textYMiddle < (this.dimensions[1] / 2))
            ? textYMiddle + tile.textHeights[geneId] + this.geneRectHeight
            : textYMiddle + (tile.textHeights[geneId] / 2);

          if (!parentInFetched) {
            text.visible = true;

            const TEXT_MARGIN = 3;

            if (this.flipText) {
              // when flipText is set, that means that the track is being displayed
              // vertically so we need to use the stored text height rather than width
              this.allBoxes.push([
                text.position.x,
                textYMiddle - fontSizeHalf - 1,
                text.position.x + tile.textHeights[geneId] + TEXT_MARGIN,
                textYMiddle + fontSizeHalf - 1,
                geneName
              ]);
            } else {
              this.allBoxes.push([
                text.position.x,
                textYMiddle - fontSizeHalf - 1,
                text.position.x + tile.textWidths[geneId] + TEXT_MARGIN,
                textYMiddle + fontSizeHalf - 1,
                geneName
              ]);
            }

            const textObj = {
              importance: +geneInfo[4],
              text,
              caption: geneName,
              strand: geneInfo[5],
              geneId
            };

            this.allTexts.push(textObj);

            allTiles.push(tile.textBgGraphics);
          } else {
            text.visible = false;
          }
        });
      });

    this.hideOverlaps(this.allBoxes, this.allTexts);
    this.renderTextBg(this.allBoxes, this.allTexts, allTiles);
  }

  renderTextBg(allBoxes, allTexts, allTiles) {
    allTexts.forEach((text, i) => {
      if (text.text.visible && allBoxes[i] && allTiles[i]) {
        const [minX, minY, maxX, maxY] = allBoxes[i];
        const width = maxX - minX;
        const height = maxY - minY;
        allTiles[i].drawRect(
          minX - (width / 2),
          minY - (height / 2),
          width,
          height,
        );
      }
    });
  }

  hideOverlaps(allBoxes, allTexts) {
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

    this.halfRectHHeight = this.dimensions[1] / 2;

    // redraw the contents
    this.visibleAndFetchedTiles().forEach((tile) => {
      this.renderTile(tile);
    });
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

    this.visibleAndFetchedTiles()
      .filter(tile => tile.allRects)
      .forEach((tile) => {
        const gTile = document.createElement('g');
        gTile.setAttribute(
          'transform',
          `translate(${tile.rectGraphics.position.x},
          ${tile.rectGraphics.position.y})
          scale(${tile.rectGraphics.scale.x},
          ${tile.rectGraphics.scale.y})`
        );

        tile.allRects.forEach((rect) => {
          const r = document.createElement('path');

          const poly = rect[0];

          let d = `M ${poly[0]} ${poly[1]}`;

          for (let i = 2; i < poly.length; i += 2) {
            d += ` L ${poly[i]} ${poly[i + 1]}`;
          }

          r.setAttribute('d', d);

          if (rect[1] === '+') {
            r.setAttribute('fill', this.options.plusStrandColor);
          } else {
            r.setAttribute('fill', this.options.minusStrandColor);
          }
          r.setAttribute('opacity', '0.3');

          gTile.appendChild(r);
        });

        output.appendChild(gTile);
      });

    this.allTexts
      .filter(text => text.text.visible)
      .forEach((text) => {
        const g = document.createElement('g');
        const t = document.createElement('text');
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('font-family', FONT_FAMILY);
        t.setAttribute('font-size', `${this.fontSize}px`);

        // this small adjustment of .2em is to place the text better
        // in relation to the rectangles used for the genes and exons
        t.setAttribute('dy', '-.2em');
        g.setAttribute('transform', `scale(${text.text.scale.x},1)`);


        if (text.strand === '+') {
          // t.setAttribute('stroke', this.options.plusStrandColor);
          t.setAttribute('fill', this.options.plusStrandColor);
        } else {
          // t.setAttribute('stroke', this.options.minusStrandColor);
          t.setAttribute('fill', this.options.minusStrandColor);
        }

        t.innerHTML = text.text.text;

        g.appendChild(t);
        g.setAttribute(
          'transform',
          `translate(${text.text.x},${text.text.y})scale(${text.text.scale.x},1)`
        );
        output.appendChild(g);
      });

    return [base, base];
  }

  /**
   * Return the data currently visible at position X and Y
   *
   * @param {Number} trackX: The x position relative to the track's start and end
   * @param {Number} trakcY: The y position relative to the track's start and end
   */
  getVisibleData(trackX, trackY) {
    const zoomLevel = this.calculateZoomLevel();

    // the width of the tile in base pairs
    const tileWidth = tileProxy.calculateTileWidth(
      this.tilesetInfo, zoomLevel, this.tilesetInfo.tile_size
    );

    // the position of the tile containing the query position
    const tilePos = this._xScale.invert(trackX) / tileWidth;
    const numRows = this.tilesetInfo.shape ? this.tilesetInfo.shape[1] : 1;

    // the position of query within the tile
    const posInTileX = this.tilesetInfo.tile_size * (tilePos - Math.floor(tilePos));
    const posInTileY = (trackY / this.dimensions[1]) * numRows;


    const tileId = this.tileToLocalId([zoomLevel, Math.floor(tilePos)]);
    const fetchedTile = this.fetchedTiles[tileId];

    let value = '';

    if (fetchedTile) {
      /*
      if (!this.tilesetInfo.shape) {
        posInTileX = fetchedTile.tileData.dense.length * (tilePos - Math.floor(tilePos));
      }
*/
      /*
      const a = rangeQuery2d(fetchedTile.tileData.dense,
        this.tilesetInfo.shape[0],
        this.tilesetInfo.shape[1],
        [Math.floor(posInTileX), Math.floor(posInTileX)],
        [posInTileY, posInTileY],
      */
      /*
      let index = null;
      if (this.tilesetInfo.shape) {
        // accomodate data from vector sources
        index = this.tilesetInfo.shape[0] * Math.floor(posInTileY) + Math.floor(posInTileX);
      } else {
        index = fetchedTile.tileData.dense.length * Math.floor(posInTileY) + Math.floor(posInTileX);
      }
*/
      //       value = format('.3f')(fetchedTile.tileData.dense[index]);
      value = `${fetchedTile.rectGraphics.position.x} | posInTileX ${posInTileX} (${trackX}) | posInTileY ${posInTileY} (${trackY})`;
    }

    // add information about the row
    if (this.tilesetInfo.row_infos) {
      value += '<br/>';
      value += this.tilesetInfo.row_infos[Math.floor(posInTileY)];
    }

    return `${value}`;
  }

  /**
   * Calculate the tile position at the given track position
   *
   * @param {Number} trackX: The track's X position
   * @param {Number} trackY: The track's Y position
   *
   * @return {array} [zoomLevel, tilePos]
   */
  getTilePosAtPosition(trackX, trackY) {
    if (!this.tilesetInfo) return undefined;

    const zoomLevel = this.calculateZoomLevel();

    // the width of the tile in base pairs
    const tileWidth = tileProxy.calculateTileWidth(
      this.tilesetInfo, zoomLevel, this.tilesetInfo.tile_size
    );

    // the position of the tile containing the query position
    const tilePos = this._xScale.invert(trackX) / tileWidth;

    return [zoomLevel, Math.floor(tilePos)];
  }

  formattedBED12HTML(bed12FieldsObj) {
    const chrom = bed12FieldsObj[0];
    const start = +bed12FieldsObj[1];
    const end = +bed12FieldsObj[2];
    const id = bed12FieldsObj[3];
    const score = bed12FieldsObj[4];
    const strand = bed12FieldsObj[5];
    const thickStart = +bed12FieldsObj[6];
    const thickEnd = +bed12FieldsObj[7];
    const itemRGB = (bed12FieldsObj[8] !== '.') ? bed12FieldsObj[8] : '0,0,0';
    const blockCount = +bed12FieldsObj[9];
    const blockSizes = bed12FieldsObj[10].split(',');
    const blockStarts = bed12FieldsObj[11].split(',');

    const hc = document.getElementsByClassName('higlass')[0];
    if (hc) {
      hc.style.cursor = 'pointer';
    }

    let itemRGBMarkup = '';
    if (this.options.itemRGBMap) {
      const itemRGBName = (this.options.itemRGBMap[itemRGB])
        ? this.options.itemRGBMap[itemRGB]
        : DEFAULT_ITEM_RGB_NAME;
      itemRGBMarkup = `<div id="bed12-component" style="display:inline-block; position:relative; top:-2px;">
        <svg width="10" height="10">
          <rect width="10" height="10" rx="2" ry="2" style="fill:rgb(${itemRGB});stroke:black;stroke-width:2;" />
        </svg>
        <span style="position:relative; top:1px; font-weight:600;">${itemRGBName}</span>
      </div>`;
    }

    /*
      With gratitude to Pierre Lindenbaum @ biostars
    */
    let elementCartoon = '';
    const elementCartoonWidth = 200;
    const elementCartoonGeneHeight = 30;
    const elementCartoonHeight = elementCartoonGeneHeight + 10;
    const elementCartoonMiddle = elementCartoonHeight / 2;
    function pos2pixel(pos) {
      return ((pos - start) / ((end - start) * 1.0)) * elementCartoonWidth;
    }
    if (blockCount > 0) {
      elementCartoon += `<svg width="${elementCartoonWidth}" height="${elementCartoonHeight}">
        <style type="text/css">
          .ticks {stroke:rgb(${itemRGB});stroke-width:1px;fill:none;}
          .gene {stroke:rgb(${itemRGB});stroke-width:1px;fill:none;}
          .translate { fill:rgb(${itemRGB});fill-opacity:1;}
          .exon { fill:rgb(${itemRGB});fill-opacity:1;}
          .score { fill:rgb(${itemRGB});fill-opacity:1;font:bold 12px sans-serif;}
        </style>
        <defs>
          <path id="ft" class="ticks" d="m -3 -3  l 3 3  l -3 3" />
          <path id="rt" class="ticks" d="m 3 -3  l -3 3  l 3 3" />
        </defs>
      `;
      const ecStart = pos2pixel(start);
      const ecEnd = pos2pixel(end);
      elementCartoon += `<line class="gene" x1=${ecStart} x2=${ecEnd} y1=${elementCartoonMiddle} y2=${elementCartoonMiddle} />`;
      const ecThickStart = pos2pixel(thickStart);
      const ecThickEnd = pos2pixel(thickEnd);
      const ecThickY = elementCartoonMiddle - elementCartoonGeneHeight / 4;
      const ecThickHeight = elementCartoonGeneHeight / 2;
      let ecThickWidth = ecThickEnd - ecThickStart;
      if (this.options.isBarPlotLike) {
        ecThickWidth = (ecThickWidth !== 1) ? 1 : ecThickWidth;
      }
      elementCartoon += `<rect class="translate" x=${ecThickStart} y=${ecThickY} width=${ecThickWidth} height=${ecThickHeight} />`;
      const ecLabelDy = '-0.25em';
      elementCartoon += `<text class="score" text-anchor="middle" x=${ecThickStart} y=${ecThickY} dy=${ecLabelDy}>${score}</text>`;
      if ((strand === '+') || (strand === '-')) {
        const ecStrandHref = (strand === '+') ? '#ft' : '#rt';
        for (let i = 0; i < elementCartoonWidth; i += 10) {
          elementCartoon += `<use x=${i} y=${elementCartoonMiddle} href=${ecStrandHref} />`;
        }
      }
      for (let i = 0; i < blockCount; i++) {
        let ecExonStart = pos2pixel(start + +blockStarts[i]);
        const ecExonY = elementCartoonMiddle - elementCartoonGeneHeight / 8;
        let ecExonWidth = pos2pixel(start + +blockSizes[i]);
        const ecExonHeight = elementCartoonGeneHeight / 4;
        if (this.options.isBarPlotLike) {
          if (i === 0) {
            ecExonStart = ecStart;
            ecExonWidth = ecStart + 1;
          } else if (i === (blockCount - 1)) {
            ecExonStart = ecEnd - 1;
            ecExonWidth = ecEnd;
          }
        }
        elementCartoon += `<rect class="exon" x=${ecExonStart} y=${ecExonY} width=${ecExonWidth} height=${ecExonHeight} />`;
      }

      elementCartoon += '</svg>';
    }

    let intervalMarkup = `${chrom}:${start}-${end}`;
    if ((strand === '+') || (strand === '-')) { intervalMarkup += `:${strand}`; }

    return `<div>
      <div id="bed12-id" style="display:block; font-size:1.2em; font-weight:600;">
        ${id}
      </div>
      <div id="bed12-component" style="display:block;">
        ${itemRGBMarkup}
      </div>
      <div id="bed12-element-cartoon" style="display:block;">
        ${elementCartoon}
      </div>
      <div id="bed12-interval" style="display:block; font-family:monospace; font-size:1.1em;">
        ${intervalMarkup}
      </div>
    </div>`;
  }

  getMouseOverHtml(trackX, trackY) {
    if (!this.tilesetInfo) return '';

    const tilePos = this.getTilePosAtPosition(trackX, trackY);
    const zoomLevel = tilePos[0];
    const tilePosition = +tilePos[1];
    const previousTilePosition = ((tilePosition - 1) > 0) ? tilePosition - 1 : 0;
    const candidateTileId = `${zoomLevel}.${tilePosition}`;
    const previousCandidateTileId = `${zoomLevel}.${previousTilePosition}`;

    /*
      The previous tile is added as a candidate, because it can render elements which "pour over"
      into the current candidate tile, and which we want to be able to test for collision over
      x-y starts and ends metadata
    */

    // console.log("this.visibleAndFetchedTiles()", this.visibleAndFetchedTiles());
    const candidateTileElements = [];
    this.visibleAndFetchedTiles().forEach((d) => {
      if ((d.tileId === candidateTileId) || (d.tileId === previousCandidateTileId)) {
        candidateTileElements.push(d);
      }
    });

    /*
      Test for collision of mouse position with candidate tile elements and return a formatted
      HTML element, where a collision is found
    */
    // console.log("candidateTileElements", candidateTileElements);
    let output = '';
    if (candidateTileElements.length !== 0) {
      candidateTileElements.forEach((ct) => {
        const xStarts = ct.xScaledStarts;
        const xEnds = ct.xScaledEnds;
        const yStarts = ct.yScaledStarts;
        const yEnds = ct.yScaledEnds;
        let candidateTileElementsIdx = 0;
        Object.keys(xStarts).forEach((k) => {
          // console.log(k, "|", trackX, xStarts[k], xEnds[k], "|", trackY, yStarts[k], yEnds[k]);
          if ((xStarts[k] < trackX)
              && xEnds[k] && (xEnds[k] >= trackX)
              && yStarts[k] && (yStarts[k] < trackY)
              && yEnds[k] && (yEnds[k] >= trackY)) {
            const candidateTileElementsDataFields = ct.tileData[candidateTileElementsIdx].fields;
            output = this.formattedBED12HTML(candidateTileElementsDataFields);
          }
          candidateTileElementsIdx++;
        });
      });
    }

    // console.log(`this.drawnGenes[${zoomLevel}]`, this.drawnGenes[zoomLevel]);

    if (output.length === 0) {
      const hc = document.getElementsByClassName('higlass')[0];
      if (hc) {
        hc.style.cursor = 'grab';
      }
    }

    return output;
  }
}

export default HorizontalGeneBED12AnnotationsTrack;
