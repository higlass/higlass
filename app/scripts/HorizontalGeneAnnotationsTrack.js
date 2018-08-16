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
const GENE_RECT_WIDTH = 1;
const GENE_RECT_HEIGHT = 10;
const TRIANGLE_HEIGHT = 6;
const MAX_TEXTS = 20;

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
  constructor(scene, dataConfig, handleTilesetInfoReceived, options, animate) {
    super(scene, dataConfig, handleTilesetInfoReceived, options, animate);

    this.animate = animate;
    this.options = options;

    this.fontSize = +this.options.fontSize || FONT_SIZE;
  }

  initTile(tile) {
    // create texts
    tile.texts = {};

    tile.rectGraphics = new PIXI.Graphics();
    tile.textGraphics = new PIXI.Graphics();

    tile.graphics.addChild(tile.rectGraphics);
    tile.graphics.addChild(tile.textGraphics);

    const MAX_TILE_ENTRIES = 50;

    if (!tile.tileData.sort) return;

    tile.tileData.sort((a, b) => b.importance - a.importance);
    tile.tileData = tile.tileData.slice(0, MAX_TILE_ENTRIES);

    tile.tileData.forEach((td, i) => {
      const geneInfo = td.fields;
      let fill = this.options.plusStrandColor ? this.options.plusStrandColor : 'blue';

      if (geneInfo[5] === '-') {
        fill = this.options.minusStrandColor ? this.options.minusStrandColor : 'red';
      }
      tile.textWidths = {};
      tile.textHeights = {};

      // don't draw texts for the latter entries in the tile
      if (i >= MAX_TEXTS) { return; }

      // geneInfo[3] is the gene symbol
      const text = new PIXI.Text(
        geneInfo[3],
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

      tile.texts[geneInfo[3]] = text; // index by geneName

      tile.textGraphics.addChild(text);
    });

    tile.initialized = true;

    this.renderTile(tile);
  }

  destroyTile() {}

  /*
   * Redraw the track because the options
   * changed
   */
  rerender(options, force) {
    const strOptions = JSON.stringify(options);
    if (!force && strOptions === this.prevOptions) return;

    super.rerender(options, force);

    this.fontSize = +this.options.fontSize || FONT_SIZE;

    this.prevOptions = strOptions;

    this.visibleAndFetchedTiles().forEach((tile) => {
      this.renderTile(tile);
    });
  }

  drawTile() {}

  renderTile(tile) {
    if (!tile.initialized) return;

    tile.allRects = [];

    // store the scale at while the tile was drawn at so that
    // we only resize it when redrawing
    tile.drawnAtScale = this._xScale.copy();
    tile.rectGraphics.clear();

    const fill = {};

    fill['+'] = colorToHex(this.options.plusStrandColor || 'blue');
    fill['-'] = colorToHex(this.options.minusStrandColor || 'red');

    tile.tileData.forEach((td, i) => {
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
      let textYMiddle = this.dimensions[1] / 2;
      const geneName = geneInfo[3];

      if (geneInfo[5] === '+') {
        // genes on the + strand drawn above and in a user-specified color or the default blue
        yMiddle -= GENE_RECT_HEIGHT - 2;
        textYMiddle -= (this.fontSize / 2) + GENE_RECT_HEIGHT;
        tile.rectGraphics.lineStyle(1, fill['+'], 0.3);
        tile.rectGraphics.beginFill(fill['+'], 0.3);
      } else {
        // genes on the - strand drawn below and in a user-specified color or the default red
        yMiddle += GENE_RECT_HEIGHT - 2;
        textYMiddle += 23;
        tile.rectGraphics.lineStyle(1, fill['-'], 0.3);
        tile.rectGraphics.beginFill(fill['-'], 0.3);
      }

      const rectX = this._xScale(txMiddle) - (GENE_RECT_WIDTH / 2);
      const rectY = yMiddle - (GENE_RECT_HEIGHT / 2);

      const xStartPos = this._xScale(txStart);
      const xEndPos = this._xScale(txEnd);

      const MIN_SIZE_FOR_EXONS = 10;

      if (xEndPos - xStartPos > MIN_SIZE_FOR_EXONS) {
        if (geneInfo.length < 14) {
          // don't draw if the input is invalid
          console.warn(
            'Gene annotations have less than 14 columns (chrName, chrStart, chrEnd, ' +
            'symbol, importance, transcript_name, geneId, transcript_type, "-", ' +
            'txStart, txEnd, exonStarts, exonEnds):',
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
            rectX,
            rectY,
            rectX + (GENE_RECT_HEIGHT / 2),
            rectY + (GENE_RECT_HEIGHT / 2),
            rectX,
            rectY + GENE_RECT_HEIGHT
          ];
        } else {
          poly = [
            rectX,
            rectY,
            rectX - (GENE_RECT_HEIGHT / 2),
            rectY + (GENE_RECT_HEIGHT / 2),
            rectX,
            rectY + GENE_RECT_HEIGHT
          ];
        }
        tile.rectGraphics.drawPolygon(poly);

        tile.allRects.push([poly, geneInfo[5]]);
      }

      // tile probably hasn't been initialized yet
      if (!tile.texts) return;

      // don't draw texts for the latter entries in the tile
      if (i >= MAX_TEXTS) return;

      const text = tile.texts[geneName];

      text.position.x = this._xScale(txMiddle);
      text.position.y = textYMiddle;
      text.style = {
        fontSize: `${this.fontSize}px`,
        fontFamily: FONT_FAMILY,
        fill: fill[geneInfo[5]]
      };

      if (!(geneInfo[3] in tile.textWidths)) {
        text.updateTransform();
        const textWidth = text.getBounds().width;
        const textHeight = text.getBounds().height;

        tile.textWidths[geneInfo[3]] = textWidth;
        tile.textHeights[geneInfo[3]] = textHeight;
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

  drawExons(graphics, txStart, txEnd, exonStarts, exonEnds, chrOffset, yMiddle, strand) {
    const exonOffsetStarts = exonStarts.split(',').map(x => +x + chrOffset);
    const exonOffsetEnds = exonEnds.split(',').map(x => +x + chrOffset);

    const xStartPos = this._xScale(txStart);
    const xEndPos = this._xScale(txEnd);

    const lineHeight = 1.5;
    const exonHeight = GENE_RECT_HEIGHT;
    const yPos = yMiddle - (lineHeight / 2);
    const width = xEndPos - xStartPos;

    const yExonPos = yMiddle - (exonHeight / 2);

    const polys = [];
    let poly = [
      xStartPos,
      yPos,
      xStartPos + width,
      yPos,
      xStartPos + width,
      yPos + lineHeight,
      xStartPos,
      yPos + lineHeight
    ];

    graphics.drawPolygon(poly);

    polys.push([
      xStartPos,
      yPos,
      xStartPos + width,
      yPos,
      xStartPos + width,
      yPos + lineHeight,
      xStartPos,
      yPos + lineHeight
    ]);

    for (let j = Math.max(this.position[0], xStartPos);
      j < Math.min(this.position[0] + this.dimensions[0], xStartPos + width);
      j += 2 * GENE_RECT_HEIGHT) {
      if (strand === '+') {
        poly = [
          j, yExonPos + ((GENE_RECT_HEIGHT - TRIANGLE_HEIGHT) / 2),
          j + (TRIANGLE_HEIGHT / 2), yExonPos + (GENE_RECT_HEIGHT / 2),
          j, yExonPos + ((GENE_RECT_HEIGHT + TRIANGLE_HEIGHT) / 2)
        ];
      } else {
        poly = [
          j, yExonPos + ((GENE_RECT_HEIGHT - TRIANGLE_HEIGHT) / 2),
          j - (TRIANGLE_HEIGHT / 2), yExonPos + (GENE_RECT_HEIGHT / 2),
          j, yExonPos + ((GENE_RECT_HEIGHT + TRIANGLE_HEIGHT) / 2)
        ];
      }

      polys.push(poly);
      graphics.drawPolygon(poly);
    }

    for (let j = 0; j < exonOffsetStarts.length; j++) {
      const exonStart = exonOffsetStarts[j];
      const exonEnd = exonOffsetEnds[j];

      const xStart = this._xScale(exonStart);
      const yStart = yExonPos;
      const localWidth = this._xScale(exonEnd) - this._xScale(exonStart);
      const height = exonHeight;

      const localPoly = [
        xStart, yStart,
        xStart + localWidth, yStart,
        xStart + localWidth, yStart + height,
        xStart, yStart + height
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

    // go through once to make sure the tiles aren't being
    // excessively stretched
    Object.values(this.fetchedTiles)
      // tile hasn't been drawn properly because we likely got some
      // bogus data from the server
      .filter(tile => tile.drawnAtScale)
      .forEach((tile) => {
        const tileK = (
          (tile.drawnAtScale.domain()[1] - tile.drawnAtScale.domain()[0]) /
          (this._xScale.domain()[1] - this._xScale.domain()[0])
        );

        if (tileK > 3) {
          this.renderTile(tile);
        }
      });

    Object.values(this.fetchedTiles)
      // tile hasn't been drawn properly because we likely got some
      // bogus data from the server
      .filter(tile => tile.drawnAtScale)
      .forEach((tile) => {
        const tileK = (
          (tile.drawnAtScale.domain()[1] - tile.drawnAtScale.domain()[0]) /
          (this._xScale.domain()[1] - this._xScale.domain()[0])
        );
        const newRange = this._xScale.domain().map(tile.drawnAtScale);

        const posOffset = newRange[0];
        tile.rectGraphics.scale.x = tileK;
        tile.rectGraphics.position.x = -posOffset * tileK;

        // move the texts

        const parentInFetched = this.parentInFetched(tile);

        if (!tile.initialized) return;

        tile.tileData.forEach((td) => {
          // tile probably hasn't been initialized yet
          if (!tile.texts) return;

          const geneInfo = td.fields;
          const geneName = geneInfo[3];
          const text = tile.texts[geneName];

          if (!text) return;

          const chrOffset = +td.chrOffset;
          const txStart = +geneInfo[1] + chrOffset;
          const txEnd = +geneInfo[2] + chrOffset;
          const txMiddle = (txStart + txEnd) / 2;
          let textYMiddle = this.dimensions[1] / 2;

          if (geneInfo[5] === '+') {
            // genes on the + strand drawn above and in a user-specified color or the
            // default blue textYMiddle -= 10;
            textYMiddle -= (this.fontSize / 2) + GENE_RECT_HEIGHT - 2;
          } else {
            // genes on the - strand drawn below and in a user-specified color or the
            // default red
            textYMiddle += (1.5 * this.fontSize) + GENE_RECT_HEIGHT + 2;
          }

          text.position.x = this._xScale(txMiddle);
          text.position.y = textYMiddle;

          if (!parentInFetched) {
            text.visible = true;

            const TEXT_MARGIN = 3;

            if (this.flipText) {
              // when flipText is set, that means that the track is being displayed
              // vertically so we need to use the stored text height rather than width
              this.allBoxes.push([
                text.position.x,
                textYMiddle - 1,
                text.position.x + tile.textHeights[geneInfo[3]] + TEXT_MARGIN,
                textYMiddle + 1
              ]);
            } else {
              this.allBoxes.push([
                text.position.x,
                textYMiddle - 1,
                text.position.x + tile.textWidths[geneInfo[3]] + TEXT_MARGIN,
                textYMiddle + 1
              ]);
            }

            this.allTexts.push({
              importance: +geneInfo[4],
              text,
              caption: geneName,
              strand: geneInfo[5]
            });
          } else {
            text.visible = false;
          }
        });
      });

    this.hideOverlaps(this.allBoxes, this.allTexts);
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

    this.pMain.position.y = this.position[1];
    this.pMain.position.x = this.position[0];
  }

  setDimensions(newDimensions) {
    super.setDimensions(newDimensions);

    // redraw the contents
    this.visibleAndFetchedTiles().forEach((tile) => {
      tile.rectGraphics.clear();

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
        gTile.setAttribute('transform',
          `translate(${tile.rectGraphics.position.x},
          ${tile.rectGraphics.position.y})
          scale(${tile.rectGraphics.scale.x},
          ${tile.rectGraphics.scale.y})`);

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
