// @ts-nocheck
import boxIntersect from 'box-intersect';
import classifyPoint from 'robust-point-in-polygon';

// Configs
import { GLOBALS } from './configs';

// Components
import HorizontalTiled1DPixiTrack from './HorizontalTiled1DPixiTrack';

// Services
import { tileProxy } from './services';

// Utils
import { colorToHex } from './utils';
import trackUtils from './track-utils';

// these are default values that are overwritten by the track's options
const FONT_SIZE = 11;
const FONT_FAMILY = 'Arial';
const GENE_LABEL_POS = 'outside';
const GENE_RECT_HEIGHT = 10;
const GENE_STRAND_SPACING = 4;
const MAX_TEXTS = 20;
const WHITE_HEX = colorToHex('#ffffff');
const EXON_LINE_HEIGHT = 2;
const EXON_HEIGHT = (2 * GENE_RECT_HEIGHT) / 3;
const GENE_MINI_TRIANGLE_HEIGHT = (2 * EXON_HEIGHT) / 3;
const MAX_GENE_ENTRIES = 50;
const MAX_FILLER_ENTRIES = 5000;
const DEFAULT_PLUS_STRAND_COLOR = 'blue';
const DEFAULT_MINUS_STRAND_COLOR = 'red';

/**
 * Event handler for when gene annotations are clicked on.
 */
const geneClickFunc = (event, track, payload) => {
  // fill rectangles are just indicators and are not meant to be
  // clicked on
  if (payload.type === 'filler') return;

  track.pubSub.publish('app.click', {
    type: 'gene-annotation',
    event,
    payload,
  });
};

/**
 * Fillers are annotations indicating that the region they cover
 * contains hidden [gene] annotations. If a filler overlaps a gene
 * then it's not necessary because we already see the gene.
 *
 * This function goes through a set of genes and fillers and flags
 * the fillers that are completely contained within a gene so that
 * we don't display them.
 *
 * @param  {array} genes   A list of gene annotations
 * @param  {array} fillers A list of filler annotations
 */
const flagOverlappingFillers = (genes, fillers) => {
  const regions = genes.concat(fillers);
  const boxes = regions.map((x) => [x.xStart, 1, x.xEnd, 1]);
  boxIntersect(boxes, (i, j) => {
    let filler = null;
    let gene = null;

    if (regions[i].type === 'filler') {
      filler = regions[i];
    } else {
      gene = regions[i];
    }

    if (regions[j].type === 'filler') {
      if (filler) return; // two fillers, don't care if they overlap
      filler = regions[j];
    } else {
      if (!filler) return;
      gene = regions[j];
    }

    if (filler.xStart >= gene.xStart && filler.xEnd <= gene.xEnd) {
      filler.hide = true;
    }
  });
};

/**
 * Initialize a tile. Pulled out from the track so that it
 * can be modified without having to modify the track
 * object (e.g. in an Observable notebooke)
 *
 * @param  {HorizontalGeneAnnotationsTrack} track   The track object
 * @param  {Object} tile    The tile to render
 * @param  {Object} options The track's options
 */
function externalInitTile(track, tile, options) {
  const {
    flipText,
    fontSize,
    fontFamily,
    plusStrandColor,
    minusStrandColor,
    maxGeneEntries,
    maxFillerEntries,
    maxTexts,
  } = options;
  // create texts
  tile.texts = {};

  tile.rectGraphics = new GLOBALS.PIXI.Graphics();
  tile.textBgGraphics = new GLOBALS.PIXI.Graphics();
  tile.textGraphics = new GLOBALS.PIXI.Graphics();
  tile.rectMaskGraphics = new GLOBALS.PIXI.Graphics();

  tile.graphics.addChild(tile.rectGraphics);
  tile.graphics.addChild(tile.textBgGraphics);
  tile.graphics.addChild(tile.textGraphics);
  tile.graphics.addChild(tile.rectMaskGraphics);

  tile.rectGraphics.mask = tile.rectMaskGraphics;

  if (!tile.tileData.sort) return;

  tile.tileData.sort((a, b) => b.importance - a.importance);

  const geneEntries = tile.tileData
    .filter((td) => td.type !== 'filler')
    .slice(0, maxGeneEntries);
  const fillerEntries = tile.tileData
    .filter((td) => td.type === 'filler')
    .slice(0, maxFillerEntries);

  tile.tileData = geneEntries.concat(fillerEntries);

  tile.tileData.forEach((td, i) => {
    if (td.type === 'filler') {
      return;
    }

    const geneInfo = td.fields;
    const geneName = geneInfo[3];
    const geneId = track.geneId(geneInfo, td.type);
    const strand = td.strand || geneInfo[5];

    td.strand = td.strand || strand;

    let fill = plusStrandColor || DEFAULT_PLUS_STRAND_COLOR;

    if (strand === '-') {
      fill = minusStrandColor || DEFAULT_MINUS_STRAND_COLOR;
    }
    tile.textWidths = {};
    tile.textHeights = {};

    // don't draw texts for the latter entries in the tile
    if (i >= maxTexts) return;

    const text = new GLOBALS.PIXI.Text(geneName, {
      fontSize: `${fontSize}px`,
      fontFamily,
      fill: colorToHex(fill),
    });
    text.interactive = true;

    if (flipText) text.scale.x = -1;

    text.anchor.x = 0.5;
    text.anchor.y = 1;

    tile.texts[geneId] = text; // index by geneName
    tile.texts[geneId].strand = strand;
    tile.textGraphics.addChild(text);
  });

  tile.initialized = true;
}

/** Draw generic rectangles... currently used for filler annotations */
function renderRects(
  rects,
  track,
  tile,
  someGraphics, // unused in this function
  xScale,
  color,
  alpha,
  centerY,
  height,
) {
  const topY = centerY - height / 2;
  const FILLER_PADDING = 0;

  rects.forEach((td) => {
    const graphics = new GLOBALS.PIXI.Graphics();

    tile.rectGraphics.addChild(graphics);

    graphics.beginFill(color, 0.1);
    graphics.lineStyle(0, color);

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
      topY,
    ];

    graphics.interactive = true;
    graphics.buttonMode = true;

    graphics.mouseup = (event) => geneClickFunc(event, track, td);
    graphics.drawPolygon(poly);
    tile.allRects.push([poly, td.strand, td]);
  });
}

/** Draw the exons within a gene */
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
  strand,
) {
  const topY = centerY - height / 2;

  const exonOffsetStarts = exonStarts.split(',').map((x) => +x + chrOffset);
  const exonOffsetEnds = exonEnds.split(',').map((x) => +x + chrOffset);

  const xStartPos = track._xScale(txStart);
  const xEndPos = track._xScale(txEnd);

  const width = xEndPos - xStartPos;
  const yMiddle = centerY;

  const polys = [];

  // draw the middle line
  let poly = [
    xStartPos,
    yMiddle - EXON_LINE_HEIGHT / 2,
    xStartPos + width,
    yMiddle - EXON_LINE_HEIGHT / 2,
    xStartPos + width,
    yMiddle + EXON_LINE_HEIGHT / 2,
    xStartPos,
    yMiddle + EXON_LINE_HEIGHT / 2,
  ];
  graphics.drawPolygon(poly);
  polys.push(poly);

  // the distance between the mini-triangles
  const triangleInterval = 2 * height;

  // the first triangle (arrowhead) will be drawn in renderGeneSymbols
  for (
    let j = Math.max(track.position[0], xStartPos) + triangleInterval;
    j < Math.min(track.position[0] + track.dimensions[0], xStartPos + width);
    j += triangleInterval
  ) {
    if (strand === '+') {
      poly = [
        j,
        yMiddle - GENE_MINI_TRIANGLE_HEIGHT / 2,
        j + GENE_MINI_TRIANGLE_HEIGHT / 2,
        yMiddle,
        j,
        yMiddle + GENE_MINI_TRIANGLE_HEIGHT / 2,
      ];
    } else {
      poly = [
        j,
        yMiddle - GENE_MINI_TRIANGLE_HEIGHT / 2,
        j - GENE_MINI_TRIANGLE_HEIGHT / 2,
        yMiddle,
        j,
        yMiddle + GENE_MINI_TRIANGLE_HEIGHT / 2,
      ];
    }

    polys.push(poly);
    graphics.drawPolygon(poly);
  }

  // draw the actual exons
  for (let j = 0; j < exonOffsetStarts.length; j++) {
    const exonStart = exonOffsetStarts[j];
    const exonEnd = exonOffsetEnds[j];

    const xStart = track._xScale(exonStart);
    const localWidth = Math.max(
      1,
      track._xScale(exonEnd) - track._xScale(exonStart),
    );

    // we're not going to draw rectangles over the arrowhead
    // at the start of the gene
    let minX = xStartPos;
    let maxX = xEndPos;
    const pointerWidth = track.geneRectHeight / 2;
    let localPoly = null;

    if (strand === '+') {
      maxX = xEndPos - pointerWidth;
      localPoly = [
        Math.min(xStart, maxX),
        topY,
        Math.min(xStart + localWidth, maxX),
        topY,
        Math.min(xStart + localWidth, maxX),
        topY + height,
        Math.min(xStart, maxX),
        topY + height,
        Math.min(xStart, maxX),
        topY,
      ];
    } else {
      minX = xStartPos + pointerWidth;
      localPoly = [
        Math.max(xStart, minX),
        topY,
        Math.max(xStart + localWidth, minX),
        topY,
        Math.max(xStart + localWidth, minX),
        topY + height,
        Math.max(xStart, minX),
        topY + height,
        Math.max(xStart, minX),
        topY,
      ];
    }

    polys.push(localPoly);
    graphics.drawPolygon(localPoly);
  }

  return polys;
}

/** Draw the arrowheads at the ends of genes */
function renderGeneSymbols(
  genes,
  track,
  tile,
  oldGraphics,
  xScale,
  color,
  alpha,
  centerY,
  height,
) {
  const topY = centerY - height / 2;

  genes.forEach((gene) => {
    const xStart = track._xScale(gene.xStart);
    const xEnd = track._xScale(gene.xEnd);

    const graphics = new GLOBALS.PIXI.Graphics();
    tile.rectGraphics.addChild(graphics);

    graphics.beginFill(color, alpha);
    graphics.interactive = true;
    graphics.buttonMode = true;
    graphics.mouseup = (evt) => geneClickFunc(evt, track, gene);

    const pointerWidth = track.geneRectHeight / 2;

    let poly = [];
    if (gene.strand === '+' || gene.fields[5] === '+') {
      const pointerStart = Math.max(xStart, xEnd - pointerWidth);
      const pointerEnd = pointerStart + pointerWidth;

      poly = [
        pointerStart,
        topY,
        pointerEnd,
        topY + track.geneRectHeight / 2,
        pointerStart,
        topY + track.geneRectHeight,
      ];
    } else {
      const pointerStart = Math.min(xEnd, xStart + pointerWidth);
      const pointerEnd = pointerStart - pointerWidth;

      poly = [
        pointerStart,
        topY,
        pointerEnd,
        topY + track.geneRectHeight / 2,
        pointerStart,
        topY + track.geneRectHeight,
      ];
    }

    graphics.drawPolygon(poly);
    tile.allRects.push([poly, gene.strand, gene]);
  });
}

function renderGeneExons(
  genes,
  track,
  tile,
  rectGraphics,
  xScale,
  color,
  alpha,
  centerY,
  height,
) {
  genes.forEach((gene) => {
    const geneInfo = gene.fields;
    const chrOffset = +gene.chrOffset;

    const exonStarts = geneInfo[12];
    const exonEnds = geneInfo[13];
    const graphics = new GLOBALS.PIXI.Graphics();
    tile.rectGraphics.addChild(graphics);

    graphics.beginFill(color, alpha);
    graphics.interactive = true;
    graphics.buttonMode = true;
    graphics.mouseup = (evt) => geneClickFunc(evt, track, gene);

    tile.allRects = tile.allRects.concat(
      drawExons(
        track,
        graphics,
        gene.xStart,
        gene.xEnd,
        exonStarts,
        exonEnds,
        chrOffset, // not used for now because we have just one chromosome
        centerY,
        height,
        gene.strand || gene.fields[5],
      ).map((x) => [x, gene.strand, gene]),
    );
  });
}

function renderGenes(
  genes,
  track,
  tile,
  graphics,
  xScale,
  color,
  alpha,
  centerY,
  height,
) {
  renderGeneSymbols(
    genes,
    track,
    tile,
    graphics,
    xScale,
    color,
    alpha,
    centerY,
    height,
  );
  renderGeneExons(
    genes,
    track,
    tile,
    graphics,
    xScale,
    color,
    alpha,
    centerY,
    height,
  );
}

/** Create a preventing this track from drawing outside of its
 * visible area
 */
function renderMask(track, tile) {
  const { tileX, tileWidth } = trackUtils.getTilePosAndDimensions(
    track.tilesetInfo,
    tile.tileId,
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

class HorizontalGeneAnnotationsTrack extends HorizontalTiled1DPixiTrack {
  /**
   * Create a new track for Gene Annotations
   *
   * Arguments:
   * ----------
   * context: Object related to the environment of this track
   *   (e.g. renderer object, pubSubs)
   * options: Options from the viewconf
   */
  constructor(context, options) {
    super(context, options);
    const { animate } = context;

    this.animate = animate;
    this.options = options;

    this.fontSize = +this.options.fontSize || FONT_SIZE;
    this.geneLabelPos = this.options.geneLabelPosition || GENE_LABEL_POS;
    this.geneRectHeight =
      +this.options.geneAnnotationHeight || GENE_RECT_HEIGHT;

    // Don't ask me why but rectangles and triangles seem to be drawn 2px larger
    // than they should be
    this.geneRectHeight -= 2;

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
      maxTexts: MAX_TEXTS,
    });

    this.renderTile(tile);
  }

  /** cleanup */
  destroyTile(tile) {
    tile.rectGraphics.destroy();
    tile.rectMaskGraphics.destroy();
    tile.textGraphics.destroy();
    tile.textBgGraphics.destroy();
    tile.graphics.destroy();
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
    this.geneStrandHSpacing = this.geneStrandSpacing / 2;
    this.geneRectHHeight = this.geneRectHeight / 2;

    this.prevOptions = strOptions;

    this.visibleAndFetchedTiles().forEach((tile) => {
      this.renderTile(tile);
    });
  }

  drawTile() {}

  geneId(geneInfo, type) {
    return `${type}_${geneInfo[0]}_${geneInfo[1]}_${geneInfo[2]}_${geneInfo[3]}`;
  }

  renderTile(tile) {
    if (!tile.initialized) return;

    tile.allRects = [];
    // store the scale at while the tile was drawn at so that
    // we only resize it when redrawing
    tile.drawnAtScale = this._xScale.copy();
    tile.rectGraphics.removeChildren();
    tile.rectGraphics.clear();
    tile.textBgGraphics.clear();

    const fill = {};
    const FILLER_RECT_ALPHA = 0.3;
    const GENE_ALPHA = 0.3;

    fill['+'] = colorToHex(
      this.options.plusStrandColor || DEFAULT_PLUS_STRAND_COLOR,
    );
    fill['-'] = colorToHex(
      this.options.minusStrandColor || DEFAULT_MINUS_STRAND_COLOR,
    );

    let plusFillerRects = tile.tileData.filter(
      (td) => td.type === 'filler' && td.strand === '+',
    );
    let minusFillerRects = tile.tileData.filter(
      (td) => td.type === 'filler' && td.strand === '-',
    );

    const plusGenes = tile.tileData.filter(
      (td) =>
        td.type !== 'filler' && (td.strand === '+' || td.fields[5] === '+'),
    );
    const minusGenes = tile.tileData.filter(
      (td) =>
        td.type !== 'filler' && (td.strand === '-' || td.fields[5] === '-'),
    );

    flagOverlappingFillers(plusGenes, plusFillerRects);
    flagOverlappingFillers(minusGenes, minusFillerRects);

    // remove the fillers that are contained within a gene
    plusFillerRects = plusFillerRects.filter((x) => !x.hide);
    minusFillerRects = minusFillerRects.filter((x) => !x.hide);

    const yMiddle = this.dimensions[1] / 2;

    // const fillerGeneSpacing = (this.options.fillerHeight - this.geneRectHeight) / 2;
    const plusStrandCenterY =
      yMiddle - this.geneRectHeight / 2 - this.geneStrandSpacing / 2;
    const minusStrandCenterY =
      yMiddle + this.geneRectHeight / 2 + this.geneStrandSpacing / 2;

    const plusRenderContext = [
      this,
      tile,
      tile.rectGraphics,
      this._xScale,
      fill['+'],
      FILLER_RECT_ALPHA,
      plusStrandCenterY,
      this.geneRectHeight,
    ];
    const minusRenderContext = [
      this,
      tile,
      tile.rectGraphics,
      this._xScale,
      fill['-'],
      FILLER_RECT_ALPHA,
      minusStrandCenterY,
      this.geneRectHeight,
    ];

    renderRects(plusFillerRects, ...plusRenderContext);
    renderRects(minusFillerRects, ...minusRenderContext);

    plusRenderContext[5] = GENE_ALPHA;
    minusRenderContext[5] = GENE_ALPHA;

    renderGenes(plusGenes, ...plusRenderContext);
    renderGenes(minusGenes, ...minusRenderContext);

    renderMask(this, tile);

    trackUtils.stretchRects(this, [
      (x) => x.rectGraphics,
      (x) => x.rectMaskGraphics,
    ]);

    for (const text of Object.values(tile.texts)) {
      text.style = {
        fontSize: `${this.fontSize}px`,
        FONT_FAMILY,
        fill: colorToHex(
          text.strand === '-'
            ? this.options.minusStrandColor || DEFAULT_MINUS_STRAND_COLOR
            : this.options.plusStrandColor || DEFAULT_PLUS_STRAND_COLOR,
        ),
      };
    }
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

  draw() {
    super.draw();

    this.allTexts = [];
    this.allBoxes = [];
    const allTiles = [];

    this.geneAreaHeight = this.geneRectHeight;
    const fontSizeHalf = this.fontSize / 2;

    trackUtils.stretchRects(this, [
      (x) => x.rectGraphics,
      (x) => x.rectMaskGraphics,
    ]);

    Object.values(this.fetchedTiles)
      // tile hasn't been drawn properly because we likely got some
      // bogus data from the server
      .filter((tile) => tile.drawnAtScale)
      .forEach((tile) => {
        tile.textBgGraphics.clear();
        tile.textBgGraphics.beginFill(
          typeof this.options.labelBackgroundColor !== 'undefined'
            ? colorToHex(this.options.labelBackgroundColor)
            : WHITE_HEX,
        );

        // move the texts
        const parentInFetched = this.parentInFetched(tile);

        if (!tile.initialized) return;

        tile.tileData.forEach((td) => {
          // tile probably hasn't been initialized yet
          if (!tile.texts) return;
          if (td.type === 'filler') return;

          const geneInfo = td.fields;
          const geneName = geneInfo[3];

          const geneId = this.geneId(geneInfo, td.type);

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

            const TEXT_MARGIN = 2;

            if (this.flipText) {
              // when flipText is set, that means that the track is being displayed
              // vertically so we need to use the stored text height rather than width
              this.allBoxes.push([
                text.position.x - tile.textHeights[geneId] / 2 - TEXT_MARGIN,
                textYMiddle - fontSizeHalf - 1,
                text.position.x + tile.textHeights[geneId] / 2 + TEXT_MARGIN,
                textYMiddle + fontSizeHalf - 1,
                geneName,
              ]);
            } else {
              this.allBoxes.push([
                text.position.x - tile.textWidths[geneId] / 2 - TEXT_MARGIN,
                textYMiddle - fontSizeHalf - 1,
                text.position.x + tile.textWidths[geneId] / 2 + TEXT_MARGIN,
                textYMiddle + fontSizeHalf - 1,
                geneName,
              ]);
            }

            this.allTexts.push({
              importance: +geneInfo[4],
              text,
              caption: geneName,
              strand: geneInfo[5],
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

  getMouseOverHtml(trackX, trackY) {
    if (!this.tilesetInfo) {
      return '';
    }

    const point = [trackX, trackY];

    for (const tile of this.visibleAndFetchedTiles()) {
      for (let i = 0; i < tile.allRects.length; i++) {
        // copy the visible rects array
        if (tile.allRects[i][2].type === 'filler') {
          continue;
        }
        const rect = tile.allRects[i][0].slice(0);

        const newArr = [];
        while (rect.length) {
          const newPoint = rect.splice(0, 2);
          newPoint[0] =
            newPoint[0] * tile.rectGraphics.scale.x +
            tile.rectGraphics.position.x;
          newPoint[1] =
            newPoint[1] * tile.rectGraphics.scale.y +
            tile.rectGraphics.position.y;

          newArr.push(newPoint);
        }

        const pc = classifyPoint(newArr, point);

        if (pc === -1) {
          const gene = tile.allRects[i][2];

          return `
            <div>
              <b>${gene.fields[3]}</b><br>
              <b>Position:</b> ${gene.fields[0]}:${gene.fields[1]}-${gene.fields[2]}<br>
              <b>Strand:</b> ${gene.fields[5]}
            </div>
          `;
        }
      }
    }

    return '';
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

    this.visibleAndFetchedTiles()
      .filter((tile) => tile.allRects)
      .forEach((tile) => {
        const gTile = document.createElement('g');
        gTile.setAttribute(
          'transform',
          `translate(${tile.rectGraphics.position.x},
          ${tile.rectGraphics.position.y})
          scale(${tile.rectGraphics.scale.x},
          ${tile.rectGraphics.scale.y})`,
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
      .filter((text) => text.text.visible)
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
          `translate(${text.text.x},${text.text.y})scale(${text.text.scale.x},1)`,
        );
        output.appendChild(g);
      });

    return [base, base];
  }
}

export default HorizontalGeneAnnotationsTrack;
