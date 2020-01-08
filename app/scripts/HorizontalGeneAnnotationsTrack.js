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
const MAX_TEXTS = 20;
const WHITE_HEX = colorToHex('#ffffff');
const EXON_LINE_HEIGHT = 2;

class HorizontalGeneAnnotationsTrack extends HorizontalTiled1DPixiTrack {
  /**
   * Create a new track for Gene Annotations
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

    const MAX_TILE_ENTRIES = 50;

    if (!tile.tileData.sort) return;

    tile.tileData.sort((a, b) => b.importance - a.importance);
    tile.tileData = tile.tileData.slice(0, MAX_TILE_ENTRIES);

    tile.tileData.forEach((td, i) => {
      const geneInfo = td.fields;
      const geneName = geneInfo[3];
      const geneId = this.geneId(geneInfo);

      let fill = this.options.plusStrandColor || 'blue';

      if (geneInfo[5] === '-') {
        fill = this.options.minusStrandColor || 'red';
      }
      tile.textWidths = {};
      tile.textHeights = {};

      // don't draw texts for the latter entries in the tile
      if (i >= MAX_TEXTS) return;

      const text = new PIXI.Text(
        geneName,
        {
          fontSize: `${this.fontSize}px`,
          fontFamily: FONT_FAMILY,
          fill: colorToHex(fill)
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

    // store the scale at while the tile was drawn at so that
    // we only resize it when redrawing
    tile.drawnAtScale = this._xScale.copy();
    tile.rectGraphics.clear();
    tile.textBgGraphics.clear();

    const fill = {};
    const zoomLevel = +tile.tileId.split('.')[0];

    fill['+'] = colorToHex(this.options.plusStrandColor || 'blue');
    fill['-'] = colorToHex(this.options.minusStrandColor || 'red');

    tile.tileData
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
      })
      .forEach((td, i) => {
        const geneInfo = td.fields;
        // the returned positions are chromosome-based and they need to
        // be converted to genome-based
        const chrOffset = +td.chrOffset;

        const txStart = +geneInfo[1] + chrOffset;
        const txEnd = +geneInfo[2] + chrOffset;
        const exonStarts = geneInfo[12];
        const exonEnds = geneInfo[13];

        const txMiddle = (txStart + txEnd) / 2;
        let yMiddle = this.dimensions[1] / 2;
        const geneId = this.geneId(geneInfo);

        if (geneInfo[5] === '+') {
          // genes on the + strand drawn above and in a user-specified color or the
          // default blue
          yMiddle -= this.geneRectHeight;
          tile.rectGraphics.beginFill(fill['+'], 0.3);
        } else {
          // genes on the - strand drawn below and in a user-specified color or the
          // default red
          yMiddle += this.geneRectHeight;
          tile.rectGraphics.beginFill(fill['-'], 0.3);
        }

        const rectX = this._xScale(txMiddle) - (GENE_RECT_WIDTH / 2);
        const rectY = geneInfo[5] === '+'
          ? yMiddle - (this.geneStrandSpacing / 2)
          : yMiddle - this.geneRectHeight + (this.geneStrandSpacing / 2);

        const xStartPos = this._xScale(txStart);
        const xEndPos = this._xScale(txEnd);

        const MIN_SIZE_FOR_EXONS = 10;

        if (xEndPos - xStartPos > MIN_SIZE_FOR_EXONS) {
          if (geneInfo.length < 14) {
            // don't draw if the input is invalid
            console.warn(
              'Gene annotations have less than 14 columns (chrName, chrStart, chrEnd, '
              + 'symbol, importance, transcript_name, geneId, transcript_type, "-", '
              + 'txStart, txEnd, exonStarts, exonEnds):',
              geneInfo
            );
          } else {
            tile.allRects = tile.allRects.concat(
              this.drawExons(
                tile.rectGraphics,
                txStart,
                txEnd,
                exonStarts,
                exonEnds,
                chrOffset,
                yMiddle,
                geneInfo[5]
              ).map(x => [x, geneInfo[5]])
            );
          }
        } else {
          let poly = [];

          if (geneInfo[5] === '+') {
            poly = [
              rectX, rectY,
              rectX + (this.geneRectHeight / 2), rectY + (this.geneRectHeight / 2),
              rectX, rectY + this.geneRectHeight
            ];
          } else {
            poly = [
              rectX, rectY,
              rectX - (this.geneRectHeight / 2), rectY + (this.geneRectHeight / 2),
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
          fill: fill[geneInfo[5]]
        };

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

  drawExons(
    graphics, txStart, txEnd, exonStarts, exonEnds, chrOffset, yMiddle, strand
  ) {
    const exonOffsetStarts = exonStarts.split(',').map(x => +x + chrOffset);
    const exonOffsetEnds = exonEnds.split(',').map(x => +x + chrOffset);

    const xStartPos = this._xScale(txStart);
    const xEndPos = this._xScale(txEnd);

    const lineHeight = EXON_LINE_HEIGHT;
    const lineHHeight = lineHeight / 2;
    const exonHeight = this.geneRectHeight;
    const width = xEndPos - xStartPos;

    const yPos = strand === '+'
      ? this.halfRectHHeight - this.geneStrandHSpacing - this.geneRectHHeight - lineHHeight
      : this.halfRectHHeight + this.geneStrandHSpacing + this.geneRectHHeight - lineHHeight;

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
      } else {
        poly = [
          j, yExonPos + ((this.geneRectHeight - this.geneTriangleHeight) / 2),
          j - (this.geneTriangleHeight / 2), yExonPos + (this.geneRectHeight / 2),
          j, yExonPos + ((this.geneRectHeight + this.geneTriangleHeight) / 2)
        ];
      }

      polys.push(poly);
      graphics.drawPolygon(poly);
    }

    for (let j = 0; j < exonOffsetStarts.length; j++) {
      const exonStart = exonOffsetStarts[j];
      const exonEnd = exonOffsetEnds[j];

      const xStart = this._xScale(exonStart);
      const localWidth = Math.max(1, this._xScale(exonEnd) - this._xScale(exonStart));
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

        tile.tileData.forEach((td) => {
          // tile probably hasn't been initialized yet
          if (!tile.texts) return;

          const geneInfo = td.fields;
          const geneName = geneInfo[3];
          const geneId = this.geneId(geneInfo);

          const text = tile.texts[geneId];

          if (!text) return;

          const chrOffset = +td.chrOffset;
          const txStart = +geneInfo[1] + chrOffset;
          const txEnd = +geneInfo[2] + chrOffset;
          const txMiddle = (txStart + txEnd) / 2;
          let textYMiddle = this.dimensions[1] / 2;

          const fontRectPadding = (this.geneRectHeight - this.fontSize) / 2;

          if (geneInfo[5] === '+') {
            // genes on the + strand drawn above and in a user-specified color or the
            // default blue textYMiddle -= 10;
            textYMiddle -= this.geneLabelPos === 'inside'
              ? fontRectPadding + this.geneStrandSpacing - 2
              : (this.fontSize / 2) + this.geneRectHeight - 2;
          } else {
            // genes on the - strand drawn below and in a user-specified color or the
            // default red
            textYMiddle += this.geneLabelPos === 'inside'
              ? this.fontSize + (this.geneStrandSpacing / 2) + fontRectPadding + 1
              : (1.5 * this.fontSize) + this.geneRectHeight + 2;
          }

          text.position.x = this._xScale(txMiddle);
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

            this.allTexts.push({
              importance: +geneInfo[4],
              text,
              caption: geneName,
              strand: geneInfo[5]
            });

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
}

export default HorizontalGeneAnnotationsTrack;
