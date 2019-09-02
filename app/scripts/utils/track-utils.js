import { zoomIdentity } from 'd3-zoom';
import AxisPixi from '../AxisPixi';

const range = (start, end) => {
  const values = [];
  for (let i = start; i < end; i++) {
    values.push(i);
  }

  return values;
};

/**
 * Calculate the zoom level from a list of available resolutions
 */
const calculateZoomLevelFromResolutions = (resolutions, scale) => {
  const sortedResolutions = resolutions.map(x => +x).sort((a, b) => b - a);

  const trackWidth = scale.range()[1] - scale.range()[0];

  const binsDisplayed = sortedResolutions
    .map(r => (scale.domain()[1] - scale.domain()[0]) / r);
  const binsPerPixel = binsDisplayed.map(b => b / trackWidth);

  // we're going to show the highest resolution that requires more than one
  // pixel per bin
  const displayableBinsPerPixel = binsPerPixel.filter(b => b < 1);

  if (displayableBinsPerPixel.length === 0) return 0;

  return binsPerPixel.indexOf(
    displayableBinsPerPixel[displayableBinsPerPixel.length - 1]
  );
};

/**
 * Calculate the current zoom level.
 */
const calculateZoomLevel = (scale, minX, maxX, binsPerTile) => {
  const rangeWidth = scale.range()[1] - scale.range()[0];

  const zoomScale = Math.max(
    (maxX - minX) / (scale.domain()[1] - scale.domain()[0]),
    1,
  );

  const viewResolution = 384;
  // const viewResolution = 2048;

  // fun fact: the number 384 is halfway between 256 and 512
  const addedZoom = Math.max(
    0,
    Math.ceil(Math.log(rangeWidth / viewResolution) / Math.LN2),
  );
  let zoomLevel = Math.round(Math.log(zoomScale) / Math.LN2) + addedZoom;

  let binsPerTileCorrection = 0;

  if (binsPerTile) {
    binsPerTileCorrection = Math.floor(((Math.log(256) / Math.log(2))
      - (Math.log(binsPerTile) / Math.log(2))));
  }

  zoomLevel += binsPerTileCorrection;

  return zoomLevel;
};

const calculate1DZoomLevel = (tilesetInfo, xScale, maxZoom) => {
  if (maxZoom === undefined) {
    maxZoom = Number.MAX_SAFE_INTEGER;
  }
  // offset by 2 because 1D tiles are more dense than 2D tiles
  // 1024 points per tile vs 256 for 2D tiles
  if (tilesetInfo.resolutions) {
    const zoomIndexX = calculateZoomLevelFromResolutions(
      tilesetInfo.resolutions, this._xScale,
      tilesetInfo.min_pos[0], this.tilesetInfo.max_pos[0] - 2
    );

    return zoomIndexX;
  }

  // the tileProxy calculateZoomLevel function only cares about the
  // difference between the minimum and maximum position
  const xZoomLevel = calculateZoomLevel(xScale,
    tilesetInfo.min_pos[0],
    tilesetInfo.max_pos[0],
    tilesetInfo.bins_per_dimension || tilesetInfo.tile_size);

  let zoomLevel = Math.min(xZoomLevel, maxZoom);
  zoomLevel = Math.max(zoomLevel, 0);
  // console.log('xScale', this._xScale.domain(), this.maxZoom);
  // console.log('zoomLevel:', zoomLevel, this.tilesetInfo.min_pos[0],
  //   this.tilesetInfo.max_pos[0]);

  return zoomLevel;
};


/**
 * Calculate the tiles that should be visible get a data domain
 * and a tileset info
 *
 * All the parameters except the first should be present in the
 * tileset_info returned by the server.
 *
 * @param zoomLevel: The zoom level at which to find the tiles (can be
 *   calculated using this.calculateZoomLevel, but needs to synchronized across
 *   both x and y scales so should be calculated externally)
 * @param scale: A d3 scale mapping data domain to visible values
 * @param minX: The minimum possible value in the dataset
 * @param maxX: The maximum possible value in the dataset
 * @param maxZoom: The maximum zoom value in this dataset
 * @param maxDim: The largest dimension of the tileset (e.g., width or height)
 *   (roughlty equal to 2 ** maxZoom * tileSize * tileResolution)
 */
const calculateTiles = (
  zoomLevel, scale, minX, maxX, maxZoom, maxDim
) => {
  const zoomLevelFinal = Math.min(zoomLevel, maxZoom);

  // the ski areas are positioned according to their
  // cumulative widths, which means the tiles need to also
  // be calculated according to cumulative width

  const tileWidth = maxDim / (2 ** zoomLevelFinal);
  // console.log('maxDim:', maxDim);

  const epsilon = 0.0000001;

  /*
  console.log('minX:', minX, 'zoomLevel:', zoomLevel);
  console.log('domain:', scale.domain(), scale.domain()[0] - minX,
  ((scale.domain()[0] - minX) / tileWidth))
  */

  return range(
    Math.max(0, Math.floor((scale.domain()[0] - minX) / tileWidth)),
    Math.min(
      2 ** zoomLevelFinal,
      Math.ceil(((scale.domain()[1] - minX) - epsilon) / tileWidth),
    ),
  );
};

/**
 * Calculate the tiles that sould be visisble given the resolution and
 * the minX and maxX values for the region
 *
 * @param resolution: The number of base pairs per bin
 * @param scale: The scale to use to calculate the currently visible tiles
 * @param minX: The minimum x position of the tileset
 * @param maxX: The maximum x position of the tileset
 */
const calculateTilesFromResolution = (resolution, scale, minX, maxX, pixelsPerTile) => {
  const epsilon = 0.0000001;
  const PIXELS_PER_TILE = pixelsPerTile || 256;
  const tileWidth = resolution * PIXELS_PER_TILE;
  const MAX_TILES = 20;
  // console.log('PIXELS_PER_TILE:', PIXELS_PER_TILE);

  if (!maxX) {
    maxX = Number.MAX_VALUE; // eslint-disable-line no-param-reassign
  }

  const lowerBound = Math.max(0, Math.floor((scale.domain()[0] - minX) / tileWidth));
  const upperBound = Math.ceil(Math.min(
    maxX,
    ((scale.domain()[1] - minX) - epsilon)
  ) / tileWidth);
  let tileRange = range(
    lowerBound,
    upperBound,
  );

  if (tileRange.length > MAX_TILES) {
    // too many tiles visible in this range
    console.warn(`Too many visible tiles: ${tileRange.length} truncating to ${MAX_TILES}`);
    tileRange = tileRange.slice(0, MAX_TILES);
  }
  // console.log('tileRange:', tileRange);

  return tileRange;
};


const calculate1DVisibleTiles = (tilesetInfo, scale) => {
  // if we don't know anything about this dataset, no point
  // in trying to get tiles
  if (!tilesetInfo) { return []; }

  // calculate the zoom level given the scales and the data bounds
  const zoomLevel = calculate1DZoomLevel(tilesetInfo, scale, tilesetInfo.max_zoom);

  if (tilesetInfo.resolutions) {
    const sortedResolutions = tilesetInfo.resolutions
      .map(x => +x)
      .sort((a, b) => b - a);

    const xTiles = calculateTilesFromResolution(
      sortedResolutions[zoomLevel],
      scale,
      tilesetInfo.min_pos[0], tilesetInfo.max_pos[0]
    );

    const tiles = xTiles.map(x => [zoomLevel, x]);

    return tiles;
  }

  // x doesn't necessary mean 'x' axis, it just refers to the relevant axis
  // (x if horizontal, y if vertical)
  const xTiles = calculateTiles(
    zoomLevel,
    scale,
    tilesetInfo.min_pos[0],
    tilesetInfo.max_pos[0],
    tilesetInfo.max_zoom,
    tilesetInfo.max_width
  );

  const tiles = xTiles.map(x => [zoomLevel, x]);
  return tiles;
};

const drawAxis = (track, valueScale) => {
  if (!track.axis) {
    track.axis = new AxisPixi(track);
    track.pBase.addChild(track.axis.pAxis);
  }
  // either no axis position is specified
  if (!track.options.axisPositionVertical && !track.options.axisPositionHorizontal) {
    track.axis.clearAxis();
    return;
  }

  if (track.options.axisPositionVertical && track.options.axisPositionVertical === 'hidden') {
    track.axis.clearAxis();
    return;
  }

  if (track.options.axisPositionHorizontal && track.options.axisPositionHorizontal === 'hidden') {
    track.axis.clearAxis();
    return;
  }

  const margin = track.options.axisMargin || 0;

  if (
    track.options.axisPositionHorizontal === 'left'
    || track.options.axisPositionVertical === 'top'
  ) {
    // left axis are shown at the beginning of the plot
    track.axis.pAxis.position.x = track.position[0] + margin;
    track.axis.pAxis.position.y = track.position[1];

    track.axis.drawAxisRight(valueScale, track.dimensions[1]);
  } else if (
    track.options.axisPositionHorizontal === 'outsideLeft'
    || track.options.axisPositionVertical === 'outsideTop'
  ) {
    // left axis are shown at the beginning of the plot
    track.axis.pAxis.position.x = track.position[0] + margin;
    track.axis.pAxis.position.y = track.position[1];

    track.axis.drawAxisLeft(valueScale, track.dimensions[1]);
  } else if (
    track.options.axisPositionHorizontal === 'right'
    || track.options.axisPositionVertical === 'bottom'
  ) {
    track.axis.pAxis.position.x = track.position[0] + track.dimensions[0] - margin;
    track.axis.pAxis.position.y = track.position[1];
    track.axis.drawAxisLeft(valueScale, track.dimensions[1]);
  } else if (
    track.options.axisPositionHorizontal === 'outsideRight'
    || track.options.axisPositionVertical === 'outsideBottom'
  ) {
    track.axis.pAxis.position.x = track.position[0] + track.dimensions[0] - margin;
    track.axis.pAxis.position.y = track.position[1];
    track.axis.drawAxisRight(valueScale, track.dimensions[1]);
  }
};

const zoomedY = (yPos, kMultiplier, transform, height) => {
  const k0 = transform.k;
  const t0 = transform.y;
  const dp = (yPos - t0) / k0;
  const k1 = Math.max(k0 / kMultiplier, 1.0);
  let t1 = k0 * dp + t0 - k1 * dp;

  // clamp at the bottom
  t1 = Math.max(t1, -(k1 - 1) * height);

  // clamp at the top
  t1 = Math.min(t1, 0);
  // right now, the point at position 162 is at position 0
  // 0 = 1 * 162 - 162
  //
  // we want that when k = 2, that point is still at position
  // 0 = 2 * 162 - t1
  //  ypos = k0 * dp + t0
  //  dp = (ypos - t0) / k0
  //  nypos = k1 * dp + t1
  //  k1 * dp + t1 = k0 * dp + t0
  //  t1 = k0 * dp +t0 - k1 * dp
  return zoomIdentity.translate(0, t1).scale(k1);
};

const trackUtils = {
  calculate1DZoomLevel,
  calculate1DVisibleTiles,
  drawAxis,
  zoomedY,
};

export default trackUtils;
