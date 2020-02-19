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
const GENE_RECT_HEIGHT = 10;
const GENE_STRAND_SPACING = 4;
const TRIANGLE_HEIGHT = 6;
const MAX_TEXTS = 20;
const WHITE_HEX = colorToHex('#ffffff');
const EXON_LINE_HEIGHT = 2;
const MAX_GENE_ENTRIES = 50;
const MAX_FILLER_ENTRIES = 5000;
const FILLER_HEIGHT = 14;

const trackUtils = {
  getTilePosAndDimensions: (tilesetInfo, tileId) => {
    /**
     * Get the tile's position in its coordinate system.
     *
     * See Tiled1DPIXITrack.js
     */
    const zoomLevel = +tileId.split('.')[0];
    const xTilePos = +tileId.split('.')[1];

    // max_width should be substitutable with 2 ** tilesetInfo.max_zoom
    const totalWidth = tilesetInfo.max_width;

    const minX = tilesetInfo.min_pos[0];

    const tileWidth = totalWidth / 2 ** zoomLevel;

    const tileX = minX + xTilePos * tileWidth;

    return {
      tileX,
      tileWidth
    };
  }
};

function externalInitTile(track, tile, options) {
  const {
    flipText,
    fontSize,
    fontFamily,
    plusStrandColor,
    minusStrandColor,
    maxGeneEntries,
    maxFillerEntries,
    maxTexts
  } = options;

  const getGeneId = geneInfo =>
    `${geneInfo[0]}_${geneInfo[1]}_${geneInfo[2]}_${geneInfo[3]}`;

  // create texts
  tile.texts = {};

  tile.rectGraphics = new PIXI.Graphics();
  tile.textBgGraphics = new PIXI.Graphics();
  tile.textGraphics = new PIXI.Graphics();
  tile.rectMaskGraphics = new PIXI.Graphics();

  tile.graphics.addChild(tile.rectGraphics);
  tile.graphics.addChild(tile.textBgGraphics);
  tile.graphics.addChild(tile.textGraphics);
  tile.graphics.addChild(tile.rectMaskGraphics);

  tile.rectGraphics.mask = tile.rectMaskGraphics;

  if (!tile.tileData.sort) return;

  tile.tileData.sort((a, b) => b.importance - a.importance);

  const geneEntries = tile.tileData
    .filter(td => td.type !== 'filler')
    .slice(0, maxGeneEntries);
  const fillerEntries = tile.tileData
    .filter(td => td.type === 'filler')
    .slice(0, maxFillerEntries);

  tile.tileData = geneEntries.concat(fillerEntries);

  tile.tileData.forEach((td, i) => {
    const geneInfo = td.fields;
    const geneName = geneInfo[3];
    const geneId = getGeneId(geneInfo);

    let fill = plusStrandColor || 'blue';

    if (geneInfo[5] === '-') {
      fill = minusStrandColor || 'red';
    }
    tile.textWidths = {};
    tile.textHeights = {};

    // don't draw texts for the latter entries in the tile
    if (i >= maxTexts) return;

    const text = new PIXI.Text(geneName, {
      fontSize: `${fontSize}px`,
      fontFamily,
      fill: colorToHex(fill)
    });
    text.interactive = true;

    if (flipText) text.scale.x = -1;

    text.anchor.x = 0.5;
    text.anchor.y = 1;

    tile.texts[geneId] = text; // index by geneName

    tile.textGraphics.addChild(text);
  });

  tile.initialized = true;
}

function renderRects(
  track,
  tile,
  graphics,
  xScale,
  rects,
  color,
  alpha,
  centerY,
  height
) {
  const topY = centerY - height / 2;
  const FILLER_PADDING = 0;
  tile.rectGraphics.beginFill(color, 0.1);
  tile.rectGraphics.lineStyle(0, color);

  rects.forEach(td => {
    const poly = [
      xScale(td.xStart) - FILLER_PADDING,
      topY,
      xScale(td.xEnd) + FILLER_PADDING,
      topY,
      xScale(td.xEnd) + FILLER_PADDING,
      topY + height,
      xScale(td.xStart) - FILLER_PADDING,
      topY + height,
      xScale(td.xStart) - FILLER_PADDING,
      topY
    ];

    // console.log('poly:', poly);
    tile.rectGraphics.drawPolygon(poly);
    tile.allRects.push([poly, td.strand]);
  });
}

function drawExons(
  track,
  graphics,
  txStart,
  txEnd,
  exonStarts,
  exonEnds,
  chrOffset,
  centerY,
  height,
  strand
) {
  const topY = centerY - height / 2;

  const exonOffsetStarts = exonStarts.split(',').map(x => +x + chrOffset);
  const exonOffsetEnds = exonEnds.split(',').map(x => +x + chrOffset);

  const xStartPos = track._xScale(txStart);
  const xEndPos = track._xScale(txEnd);

  const width = xEndPos - xStartPos;
  const yMiddle = centerY;

  const polys = [];
  let poly = [
    xStartPos,
    yMiddle - EXON_LINE_HEIGHT / 2,
    xStartPos + width,
    yMiddle - EXON_LINE_HEIGHT / 2,
    xStartPos + width,
    yMiddle + EXON_LINE_HEIGHT / 2,
    xStartPos,
    yMiddle + EXON_LINE_HEIGHT / 2
  ];

  graphics.drawPolygon(poly);

  // Draw the middle line
  polys.push(poly);

  for (
    let j = Math.max(track.position[0], xStartPos);
    j < Math.min(track.position[0] + track.dimensions[0], xStartPos + width);
    j += 2 * height
  ) {
    if (strand === '+') {
      poly = [
        j,
        yMiddle - height / 2,
        j + height / 2,
        yMiddle,
        j,
        yMiddle + height / 2
      ];
    } else {
      poly = [
        j,
        yMiddle - height / 2,
        j - height / 2,
        yMiddle,
        j,
        yMiddle + height / 2
      ];
    }

    polys.push(poly);
    graphics.drawPolygon(poly);
  }

  for (let j = 0; j < exonOffsetStarts.length; j++) {
    const exonStart = exonOffsetStarts[j];
    const exonEnd = exonOffsetEnds[j];

    const xStart = track._xScale(exonStart);
    const localWidth = Math.max(
      1,
      track._xScale(exonEnd) - track._xScale(exonStart)
    );

    const localPoly = [
      xStart,
      topY,
      xStart + localWidth,
      topY,
      xStart + localWidth,
      topY + height,
      xStart,
      topY + height,
      xStart,
      topY
    ];

    polys.push(localPoly);
    graphics.drawPolygon(localPoly);
  }

  return polys;
}

function renderGeneSymbols(
  track,
  tile,
  graphics,
  xScale,
  genes,
  color,
  alpha,
  centerY,
  height
) {
  const topY = centerY - height / 2;
  tile.rectGraphics.beginFill(color, alpha);
  // tile.rectGraphics.lineStyle(1, color, 0.2);

  genes.forEach(gene => {
    const xStart = track._xScale(gene.xStart);

    let poly = [];
    if (gene.strand === '+') {
      poly = [
        xStart,
        topY,
        xStart + track.geneRectHeight / 2,
        topY + track.geneRectHeight / 2,
        xStart,
        topY + track.geneRectHeight
      ];
    } else {
      poly = [
        xStart,
        topY,
        xStart - track.geneRectHeight / 2,
        topY + track.geneRectHeight / 2,
        xStart,
        topY + track.geneRectHeight
      ];
    }

    // console.log('poly:', poly);
    tile.rectGraphics.drawPolygon(poly);
    tile.allRects.push([poly, gene.strand]);
  });
}

function renderGeneExons(
  track,
  tile,
  graphics,
  xScale,
  genes,
  color,
  alpha,
  centerY,
  height
) {
  genes.forEach(gene => {
    const geneInfo = gene.fields;
    const chrOffset = +gene.chrOffset;

    const exonStarts = geneInfo[12];
    const exonEnds = geneInfo[13];
    tile.allRects = tile.allRects.concat(
      drawExons(
        track,
        tile.rectGraphics,
        gene.xStart,
        gene.xEnd,
        exonStarts,
        exonEnds,
        chrOffset, // not used for now because we have just one chromosome
        centerY,
        height,
        gene.strand
      ).map(x => [x, gene.strand])
    );
  });
}

function renderGenes(
  track,
  tile,
  graphics,
  xScale,
  genes,
  color,
  alpha,
  centerY,
  height
) {
  const MIN_SIZE_FOR_EXONS = 10;

  // partition the set of genes into those we need to draw
  // exons for (i.e. those whose rendered size is > MIN_SIZE_FOR_EXONS)
  // and those that we can just draw a small symbol for
  // (i.e. those whose rendered size is < MIN_SIZE_FOR_EXONS)
  const smallGenes = genes.filter(
    gene =>
      track._xScale(gene.xEnd) - track._xScale(gene.xStart) < MIN_SIZE_FOR_EXONS
  );
  const largeGenes = genes.filter(
    gene =>
      track._xScale(gene.xEnd) - track._xScale(gene.xStart) >=
      MIN_SIZE_FOR_EXONS
  );

  renderGeneSymbols(
    track,
    tile,
    graphics,
    xScale,
    smallGenes,
    color,
    alpha,
    centerY,
    height
  );
  renderGeneExons(
    track,
    tile,
    graphics,
    xScale,
    largeGenes,
    color,
    alpha,
    centerY,
    height
  );
}

function renderMask(track, tile) {
  const { tileX, tileWidth } = trackUtils.getTilePosAndDimensions(
    track.tilesetInfo,
    tile.tileId
  );

  tile.rectMaskGraphics.clear();

  const randomColor = Math.floor(Math.random() * 16 ** 6);
  tile.rectMaskGraphics.beginFill(randomColor, 0.3);

  const x = track._xScale(tileX);
  const y = 0;
  const width = track._xScale(tileX + tileWidth) - track._xScale(tileX);
  const height = track.dimensions[1];
  tile.rectMaskGraphics.drawRect(x, y, width, height);
}

function stretchRects(track) {
  Object.values(track.fetchedTiles)
    // tile hasn't been drawn properly because we likely got some
    // bogus data from the server
    .forEach(tile => {
      if (!tile.drawnAtScale) return;
      const tileK =
        (tile.drawnAtScale.domain()[1] - tile.drawnAtScale.domain()[0]) /
        (track._xScale.domain()[1] - track._xScale.domain()[0]);

      if (tileK > 3) {
        // too stretched out, needs to be re-rendered
        track.renderTile(tile);
      } else {
        // can be stretched a little bit, just need to set the scale
        const newRange = track._xScale.domain().map(tile.drawnAtScale);
        const posOffset = newRange[0];

        tile.rectGraphics.scale.x = tileK;
        tile.rectGraphics.position.x = -posOffset * tileK;
        tile.rectMaskGraphics.scale.x = tileK;
        tile.rectMaskGraphics.position.x = -posOffset * tileK;
      }
    });
}

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
    this.geneRectHeight =
      +this.options.geneAnnotationHeight || GENE_RECT_HEIGHT;
    this.fillerHeight = +this.fillerHeight || FILLER_HEIGHT;
    // Don't ask me why but rectangles and triangles seem to be drawn 2px larger
    // than they should be
    this.geneRectHeight -= 2;

    this.geneTriangleHeight = 0.6 * this.geneRectHeight || TRIANGLE_HEIGHT;
    this.geneStrandSpacing =
      +this.options.geneStrandSpacing || GENE_STRAND_SPACING;
    this.geneStrandHSpacing = this.geneStrandSpacing / 2;
    this.geneRectHHeight = this.geneRectHeight / 2;
  }

  initTile(tile) {
    externalInitTile(this, tile, {
      flipText: this.flipText,
      fontSize: this.fontSize,
      fontFamily: FONT_FAMILY,
      plusStrandColor: this.options.plusStrandColor,
      minusStrandColor: this.options.minusStrandColor,
      maxGeneEntries: MAX_GENE_ENTRIES,
      maxFillerEntries: MAX_FILLER_ENTRIES,
      maxTexts: MAX_TEXTS
    });

    this.renderTile(tile);
  }

  destroyTile(tile) {
    const zoomLevel = +tile.tileId.split('.')[0];
    const tiles = this.visibleAndFetchedTiles();
    const tileIds = {};
    tiles.forEach(t => {
      tileIds[t.tileId] = t;
    });

    if (tile.tileData && tile.tileData.filter && this.drawnGenes[zoomLevel]) {
      tile.tileData
        .filter(td => this.drawnGenes[zoomLevel][td.fields[3]])
        .forEach(td => {
          const gene = td.fields[3];
          // We might need to rerender because we're about to remove a tile, which can
          // contain gene annotations stretching multiple tiles. By removing this tile
          // the annotation visualization will be gone but the other tiles might still
          // contain its data.
          if (this.drawnGenes[zoomLevel][gene]) {
            const reRender = Object.keys(
              this.drawnGenes[zoomLevel][gene].otherTileIds
            ).some(tileId => {
              if (tileIds[tileId]) {
                this.drawnGenes[zoomLevel][gene].otherTileIds[
                  tileId
                ] = undefined;
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
    this.geneRectHeight =
      +this.options.geneAnnotationHeight || GENE_RECT_HEIGHT;
    this.geneTriangleHeight = 0.6 * this.geneRectHeight || TRIANGLE_HEIGHT;
    this.geneStrandHSpacing = this.geneStrandSpacing / 2;
    this.geneRectHHeight = this.geneRectHeight / 2;

    this.prevOptions = strOptions;

    this.visibleAndFetchedTiles().forEach(tile => {
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
    const FILLER_RECT_ALPHA = 0.3;
    const GENE_ALPHA = 0.3;

    fill['+'] = colorToHex(this.options.plusStrandColor || 'blue');
    fill['-'] = colorToHex(this.options.minusStrandColor || 'red');

    const plusFillerRects = tile.tileData.filter(
      td => td.type === 'filler' && td.strand === '+'
    );
    const minusFillerRects = tile.tileData.filter(
      td => td.type === 'filler' && td.strand === '-'
    );

    // console.log('plusFillerRects', plusFillerRects, tile.tileData);

    const plusGenes = tile.tileData.filter(
      td => td.type !== 'filler' && (td.strand === '+' || td.fields[5] === '+')
    );
    const minusGenes = tile.tileData.filter(
      td => td.type !== 'filler' && (td.strand === '-' || td.fields[5] === '-')
    );

    const yMiddle = this.dimensions[1] / 2;

    // const fillerGeneSpacing = (this.options.fillerHeight - this.geneRectHeight) / 2;
    const plusStrandCenterY =
      yMiddle - this.fillerHeight / 2 - this.geneStrandSpacing / 2;
    const minusStrandCenterY =
      yMiddle + this.fillerHeight / 2 + this.geneStrandSpacing / 2;

    renderRects(
      this,
      tile,
      tile.rectGraphics,
      this._xScale,
      plusFillerRects,
      fill['+'],
      FILLER_RECT_ALPHA,
      plusStrandCenterY,
      this.fillerHeight
    );
    renderRects(
      this,
      tile,
      tile.rectGraphics,
      this._xScale,
      minusFillerRects,
      fill['-'],
      FILLER_RECT_ALPHA,
      minusStrandCenterY,
      this.fillerHeight
    );

    renderGenes(
      this,
      tile,
      tile.rectGraphics,
      this._xScale,
      plusGenes,
      fill['+'],
      GENE_ALPHA,
      plusStrandCenterY,
      this.geneRectHeight
    );
    renderGenes(
      this,
      tile,
      tile.rectGraphics,
      this._xScale,
      minusGenes,
      fill['-'],
      GENE_ALPHA,
      minusStrandCenterY,
      this.geneRectHeight
    );

    renderMask(this, tile);
  }

  calculateZoomLevel() {
    // offset by 2 because 1D tiles are more dense than 2D tiles
    // 1024 points per tile vs 256 for 2D tiles
    const xZoomLevel = tileProxy.calculateZoomLevel(
      this._xScale,
      this.tilesetInfo.min_pos[0],
      this.tilesetInfo.max_pos[0]
    );

    let zoomLevel = Math.min(xZoomLevel, this.maxZoom);
    zoomLevel = Math.max(zoomLevel, 0);

    return zoomLevel;
  }

  draw() {
    super.draw();

    this.allTexts = [];
    this.allBoxes = [];
    const allTiles = [];

    this.geneAreaHeight = Math.max(this.geneRectHeight, this.fillerHeight);
    const fontSizeHalf = this.fontSize / 2;

    stretchRects(this);

    Object.values(this.fetchedTiles)
      // tile hasn't been drawn properly because we likely got some
      // bogus data from the server
      .filter(tile => tile.drawnAtScale)
      .forEach(tile => {
        tile.textBgGraphics.clear();
        tile.textBgGraphics.beginFill(
          typeof this.options.labelBackgroundColor !== 'undefined'
            ? colorToHex(this.options.labelBackgroundColor)
            : WHITE_HEX
        );

        // move the texts
        const parentInFetched = this.parentInFetched(tile);

        if (!tile.initialized) return;

        tile.tileData.forEach(td => {
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

          const fontRectPadding = (this.geneAreaHeight - this.fontSize) / 2;

          if (geneInfo[5] === '+') {
            // genes on the + strand drawn above and in a user-specified color or the
            // default blue textYMiddle -= 10;
            textYMiddle -=
              this.geneLabelPos === 'inside'
                ? fontRectPadding + this.geneStrandSpacing - 2
                : this.fontSize / 2 + this.geneAreaHeight - 2;
          } else {
            // genes on the - strand drawn below and in a user-specified color or the
            // default red
            textYMiddle +=
              this.geneLabelPos === 'inside'
                ? this.fontSize +
                  this.geneStrandSpacing / 2 +
                  fontRectPadding +
                  1
                : 1.5 * this.fontSize + this.geneAreaHeight + 2;
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
          minX - width / 2,
          minY - height / 2,
          width,
          height
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
    this.visibleAndFetchedTiles().forEach(tile => {
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
    output.setAttribute(
      'transform',
      `translate(${this.position[0]},${this.position[1]})`
    );

    track.appendChild(output);

    this.visibleAndFetchedTiles()
      .filter(tile => tile.allRects)
      .forEach(tile => {
        const gTile = document.createElement('g');
        gTile.setAttribute(
          'transform',
          `translate(${tile.rectGraphics.position.x},
          ${tile.rectGraphics.position.y})
          scale(${tile.rectGraphics.scale.x},
          ${tile.rectGraphics.scale.y})`
        );

        tile.allRects.forEach(rect => {
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
      .forEach(text => {
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
