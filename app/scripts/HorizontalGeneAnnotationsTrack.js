import boxIntersect from 'box-intersect';
import * as PIXI from 'pixi.js';

// Components
import HorizontalTiled1DPixiTrack from './HorizontalTiled1DPixiTrack';

// Services
import { tileProxy } from './services';

// Utils
import { colorToHex } from './utils';

const FONT_SIZE = 11;
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
    this.textFontSize = `${FONT_SIZE}px`;
    this.textFontFamily = 'Arial';

    this.animate = animate;
    this.options = options;
  }

  initTile(tile) {
    // console.log('initTile...', tile.tileId);
    // create texts
    tile.texts = {};

    tile.rectGraphics = new PIXI.Graphics();
    tile.textGraphics = new PIXI.Graphics();

    tile.graphics.addChild(tile.rectGraphics);
    tile.graphics.addChild(tile.textGraphics);

    const MAX_TILE_ENTRIES = 50;

    if (!tile.tileData.sort) {
      // console.warn('Strange tileData', tile);
      return;
    }

    tile.tileData.sort((a, b) => b.importance - a.importance);
    tile.tileData = tile.tileData.slice(0, MAX_TILE_ENTRIES);

    tile.tileData.forEach((td, i) => {
      const geneInfo = td.fields;
      let fill = this.options.plusStrandColor ? this.options.plusStrandColor : 'blue';

      if (geneInfo[5] == '-') {
        fill = this.options.minusStrandColor ? this.options.minusStrandColor : 'red';
      }
      tile.textWidths = {};
      tile.textHeights = {};

      // don't draw texts for the latter entries in the tile
      if (i >= MAX_TEXTS) { return; }

      // geneInfo[3] is the gene symbol
      const text = new PIXI.Text(geneInfo[3], { fontSize: this.textFontSize,
        fontFamily: this.textFontFamily,
        fill: colorToHex(fill) });
      text.interactive = true;
      text.click = function (e) {
        console.log('click');
      };

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

  }

  rerender(options, force) {
    /*
     * Redraw the track because the options
     * changed
     */
    const strOptions = JSON.stringify(options);
    if (!force && strOptions === this.prevOptions) return;

    super.rerender(options, force);

    this.prevOptions = strOptions;

    for (const tile of this.visibleAndFetchedTiles()) {
      this.renderTile(tile);
    }
  }

  drawTile(tile) {

  }

  renderTile(tile) {
    if (!tile.initialized) { return; }

    tile.allRects = [];

    // store the scale at while the tile was drawn at so that
    // we only resize it when redrawing
    tile.drawnAtScale = this._xScale.copy();
    const fill = {};

    fill['+'] = colorToHex(this.options.plusStrandColor ? this.options.plusStrandColor : 'blue');
    fill['-'] = colorToHex(this.options.minusStrandColor ? this.options.minusStrandColor : 'red');

    tile.tileData.forEach((td, i) => {
      const geneInfo = td.fields;
      // the returned positions are chromosome-based and they need to
      // be converted to genome-based
      const chrOffset = +td.chrOffset;

      const txStart = +geneInfo[1] + chrOffset;
      const txEnd = +geneInfo[2] + chrOffset;
      let exonStarts = geneInfo[12],
        exonEnds = geneInfo[13];

      const txMiddle = (txStart + txEnd) / 2;

      let yMiddle = this.dimensions[1] / 2;
      let textYMiddle = this.dimensions[1] / 2;
      const geneName = geneInfo[3];

      if (geneInfo[5] == '+') {
        // genes on the + strand drawn above and in a user-specified color or the default blue
        yMiddle -= GENE_RECT_HEIGHT - 2;
        textYMiddle -= FONT_SIZE / 2 + GENE_RECT_HEIGHT;
        tile.rectGraphics.lineStyle(1, fill['+'], 0.3);
        tile.rectGraphics.beginFill(fill['+'], 0.3);
      } else {
        // genes on the - strand drawn below and in a user-specified color or the default red
        yMiddle += GENE_RECT_HEIGHT - 2;
        textYMiddle += 23;
        tile.rectGraphics.lineStyle(1, fill['-'], 0.3);
        tile.rectGraphics.beginFill(fill['-'], 0.3);
      }

      // let height = valueScale(Math.log(+geneInfo[4]));
      // let width= height;

      const rectX = this._xScale(txMiddle) - GENE_RECT_WIDTH / 2;
      const rectY = yMiddle - GENE_RECT_HEIGHT / 2;

      const xStartPos = this._xScale(txStart);
      const xEndPos = this._xScale(txEnd);

      const MIN_SIZE_FOR_EXONS = 10;

      if (xEndPos - xStartPos > MIN_SIZE_FOR_EXONS) {
        if (geneInfo.length < 14) {
          // don't draw if the input is invalid
          console.warn("Gene annotations have less than 14 columns (chrName, chrStart, chrEnd, symbol, importance, transcript_name, geneId, transcript_type, '-', txStart, txEnd, exonStarts, exonEnds:", geneInfo);
        } else {
          tile.allRects = tile.allRects.concat(
            this.drawExons(tile.rectGraphics, txStart, txEnd, exonStarts, exonEnds, chrOffset, yMiddle, geneInfo[5])
              .map(x => [x, geneInfo[5]])
          );
        }
        // this.drawExons(tile.textGraphics, txStart, txEnd, exonStarts, exonEnds, chrOffset, yMiddle)
      } else {
        // graphics.drawRect(rectX, rectY, width, height);
        // console.log('rectY', rectY);
        // this.allRects.push([rectX, rectY, GENE_RECT_WIDTH, GENE_RECT_HEIGHT, geneInfo[5]]);
        const triangleWidth = GENE_RECT_HEIGHT;
        let poly = [];

        if (geneInfo[5] == '+') {
          poly = [
              rectX, rectY, 
              rectX + GENE_RECT_HEIGHT / 2, rectY + GENE_RECT_HEIGHT / 2, 
              rectX, rectY + GENE_RECT_HEIGHT
            ]
        } else {
          poly = [
            rectX, rectY, 
            rectX - GENE_RECT_HEIGHT / 2, rectY + GENE_RECT_HEIGHT / 2, 
            rectX, rectY + GENE_RECT_HEIGHT
          ]
        }
        tile.rectGraphics.drawPolygon(poly);

        //tile.rectGraphics.drawRect(rectX, rectY, GENE_RECT_WIDTH, GENE_RECT_HEIGHT);
        tile.allRects.push([poly, geneInfo[5]]);
      }

      if (!tile.texts) {
        // tile probably hasn't been initialized yet
        return;
      }

      // don't draw texts for the latter entries in the tile
      if (i >= MAX_TEXTS) { return; }

      const text = tile.texts[geneName];

      text.position.x = this._xScale(txMiddle);
      text.position.y = textYMiddle;
      text.style = { fontSize: this.textFontSize,
        fontFamily: this.textFontFamily,
        fill: fill[geneInfo[5]] };

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
    exonStarts = exonStarts.split(',').map(x => +x + chrOffset);
    exonEnds = exonEnds.split(',').map(x => +x + chrOffset);
    const rects = [];

    const xStartPos = this._xScale(txStart);
    const xEndPos = this._xScale(txEnd);

    const lineHeight = 1.5;
    const exonHeight = GENE_RECT_HEIGHT;
    const yPos = yMiddle - lineHeight / 2;
    // let yPos = (d.height - lineHeight) / 2 + 5 ; //-(d.height - yScale(tileData[i]));
    const width = xEndPos - xStartPos;

    const yExonPos = yMiddle - exonHeight / 2;

    const polys = [];
    let poly = [
      xStartPos, yPos, 
      xStartPos + width, yPos,
      xStartPos + width, yPos + lineHeight,
      xStartPos, yPos + lineHeight
    ];
    
    graphics.drawPolygon(poly);

    polys.push([
      xStartPos, yPos, 
      xStartPos + width, yPos,
      xStartPos + width, yPos + lineHeight,
      xStartPos, yPos + lineHeight
    ]);

    for (let j = Math.max(this.position[0], xStartPos); 
      j < Math.min(this.position[0] + this.dimensions[0], xStartPos + width);
      j += 2 * GENE_RECT_HEIGHT) {
      if (strand === '+') {
        poly = [j, yExonPos + (GENE_RECT_HEIGHT - TRIANGLE_HEIGHT) / 2,
            j + TRIANGLE_HEIGHT / 2, yExonPos + GENE_RECT_HEIGHT / 2, 
            j, yExonPos + (GENE_RECT_HEIGHT + TRIANGLE_HEIGHT) / 2]
      } else {
        poly = [j, yExonPos + (GENE_RECT_HEIGHT - TRIANGLE_HEIGHT) / 2,
            j - TRIANGLE_HEIGHT / 2, yExonPos + GENE_RECT_HEIGHT / 2, 
            j, yExonPos + (GENE_RECT_HEIGHT + TRIANGLE_HEIGHT) / 2]
      }

      polys.push(poly)
      graphics.drawPolygon(poly);
    }

    for (let j = 0; j < exonStarts.length; j++) {
      const exonStart = exonStarts[j];
      const exonEnd = exonEnds[j];

      const xStart = this._xScale(exonStart);
      const yStart = yExonPos;
      const width = this._xScale(exonEnd) - this._xScale(exonStart);
      const height = exonHeight;

      const poly = [
        xStart, yStart,
        xStart + width, yStart,
        xStart + width, yStart + height,
        xStart, yStart + height
      ];

      polys.push(poly)

      graphics.drawPolygon(poly)    
    }

    return polys;
  }

  draw() {
    super.draw();
    // console.trace('drawing', this, this._xScale.domain(), this._xScale.range());

    // graphics.clear();

    const maxValue = 0;
    this.allTexts = [];
    this.allBoxes = [];

    // go through once to make sure the tiles aren't being
    // excessively stretched
    for (const fetchedTileId in this.fetchedTiles) {
      const tile = this.fetchedTiles[fetchedTileId];

      if (!tile.drawnAtScale) {
        // tile hasn't been drawn properly because we likely got some
        // bogus data from the server
        // console.warn("Tile without drawnAtScale:", tile);
        continue;
      }

      const tileK = (tile.drawnAtScale.domain()[1] - tile.drawnAtScale.domain()[0]) / (this._xScale.domain()[1] - this._xScale.domain()[0]);

      if (tileK > 3) {
        this.renderTile(tile);
      }
    }

    for (const fetchedTileId in this.fetchedTiles) {
      const tile = this.fetchedTiles[fetchedTileId];

      if (!tile.drawnAtScale) {
        // tile hasn't been drawn properly because we likely got some
        // bogus data from the server
        // console.warn("Tile without drawnAtScale:", tile);
        continue;
      }

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

        if (geneInfo[5] == '+') {
          // genes on the + strand drawn above and in a user-specified color or the default blue
          // textYMiddle -= 10;
          textYMiddle -= FONT_SIZE / 2 + GENE_RECT_HEIGHT - 2;
        } else {
          // genes on the - strand drawn below and in a user-specified color or the default red
          textYMiddle += 1.5 * FONT_SIZE + GENE_RECT_HEIGHT + 2;
        }

        text.position.x = this._xScale(txMiddle);
        text.position.y = textYMiddle;

        if (!parentInFetched) {
          text.visible = true;

          const TEXT_MARGIN = 3;

          if (this.flipText) {
            // when flipText is set, that means that the track is being displayed vertically so we need to use
            // the stored text height rather than width
            this.allBoxes.push([text.position.x, textYMiddle - 1, text.position.x + tile.textHeights[geneInfo[3]] + TEXT_MARGIN, textYMiddle + 1]);
          } else
            this.allBoxes.push([text.position.x, textYMiddle - 1, text.position.x + tile.textWidths[geneInfo[3]] + TEXT_MARGIN, textYMiddle + 1]);

          this.allTexts.push({ importance: +geneInfo[4], text, caption: geneName, strand: geneInfo[5] });
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
    // console.log('allTexts.length', allTexts.length);

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
        // console.log('hiding:', allTexts[j].caption)
        allTexts[j].text.visible = false;
      } else {
        // console.log('hiding:', allTexts[i].caption)
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

    let allRects = [];
    for (const tile of this.visibleAndFetchedTiles()) {
      const gTile = document.createElement('g');
      gTile.setAttribute('transform',
        `translate(${tile.rectGraphics.position.x},
        ${tile.rectGraphics.position.y})
        scale(${tile.rectGraphics.scale.x},
        ${tile.rectGraphics.scale.y})`);

      if (!tile.allRects)
        continue;

      for (const rect of tile.allRects) {
        const r = document.createElement('path');

        const poly = rect[0];

        let d = `M ${poly[0]} ${poly[1]}`

        for (let i = 2; i < poly.length; i+= 2) {
          d += ` L ${poly[i]} ${poly[i+1]}`;
        }

        r.setAttribute('d', d);

        if (rect[1] == '+') {
          r.setAttribute('fill', this.options.plusStrandColor);
        } else {
          r.setAttribute('fill', this.options.minusStrandColor);
        }

        gTile.appendChild(r);
      }

      output.appendChild(gTile);
    }

    for (const text of this.allTexts) {
      if (!text.text.visible) { continue; }

      const g = document.createElement('g');
      const t = document.createElement('text');
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-family', this.textFontFamily);
      t.setAttribute('font-size', this.textFontSize);

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
      g.setAttribute('transform', `translate(${text.text.x},${text.text.y})scale(${text.text.scale.x},1)`);
      output.appendChild(g);
    }

    return [base, base];
  }
}

export default HorizontalGeneAnnotationsTrack;
