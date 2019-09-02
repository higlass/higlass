import { zoomIdentity } from 'd3-zoom';
import AxisPixi from '../AxisPixi';

/**
 * The d3.range and python range functinons. Returns
 * an array of consecutive integers between start and end.
 *
 * @param  {number} start Lower limit (included in result)
 * @param  {number} end   Upper limit (not included in result)
 * @return {array}       A list of consecutive integers from start to end
 */
const range = (start, end) => {
  const values = [];
  for (let i = start; i < end; i++) {
    values.push(i);
  }

  return values;
};

/**
 * Calculate the zoom level from a list of available resolutions
 *
 * @param {array} resolutions A list of data resolutions (e.g. [100,1000])
 * @param {function} scale The current D3 scale function describing the domain and range
 *                         of the view.
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
 * Calculate the current zoom level from powers of two resolutions.
 *
 * @param {d3.scale} scale The current scale used for the view.
 * @param {Number} minX The minimum possible X value
 * @param {Number} maxX The maximum possible x value
 * @param {number} binsPerTile The width of each tile in whatever unit the x-axis is (bp for genomic data).
 */
const calculateZoomLevel = (scale, minX, maxX, binsPerTile) => {
  const rangeWidth = scale.range()[1] - scale.range()[0];

  const zoomScale = Math.max(
    (maxX - minX) / (scale.domain()[1] - scale.domain()[0]),
    1,
  );

  // fun fact: the number 384 is halfway between 256 and 512
  // this constant determines the maximum number of pixels that
  // a tile can span
  const VIEW_RESOLUTION = 384;

  const addedZoom = Math.max(
    0,
    Math.ceil(Math.log(rangeWidth / VIEW_RESOLUTION) / Math.LN2),
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

/**
 * Calculate the current zoom level for a 1D track
 *
 * @param  {object} tilesetInfo The tileset info for the track. Should contain
 *                              min_pos and max_pos arrays, each of which has one
 *                              value which stores the minimum and maximum data
 *                              positions respectively.
 * @param  {function} xScale      The current D3 scale function for the track.
 * @param  {number} maxZoom     The maximum zoom level allowed by the track.
 * @return {number}                The current zoom level of the track.
 */
const calculate1DZoomLevel = (tilesetInfo, xScale, maxZoom) => {
  if (typeof maxZoom === 'undefined') {
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
const calculateTilesFromResolution = (
  resolution, scale, minX, maxX = Number.MAX_VALUE, pixelsPerTile = 256
) => {
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

/**
 * Calculate which tiles should be visible given a track's
 * scale.
 *
 * @param  {Object} tilesetInfo The track's tileset info, containing either the `resolutions`
 *                              list or min_pos and max_pos arrays
 * @param  {d3.scale} scale     The track's scale.
 * @return {Array}             A list of visible tiles (e.g. [[1,0],[1,1]])
 */
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

/**
 * Draw an axis on a track. Where on the track the axis will be drawn
 * is taken from the track's options.
 *
 * @param  {PixiTrack} track   The track to decorate with an axis.
 * @param  {d3.scale} valueScale The scale that the axis should draw.
 */
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

/**
 * A track is being dragged along it's value scale axis.
 *
 * @param {PixiTrack} Track The track being dragged.
 * @param  {Number} dY The change in y position.
 */
const movedY = (track, dY) => {
  // see the reasoning behind why the code in
  // zoomedY is commented out.

  const vst = track.valueScaleTransform;
  const { y, k } = vst;
  const height = track.dimensions[1];

  // clamp at the bottom and top
  if (
    y + dY / k > -(k - 1) * height
    && y + dY / k < 0
  ) {
    track.valueScaleTransform = vst.translate(
      0, dY / k
    );
  }

  Object.values(track.fetchedTiles).forEach((tile) => {
    tile.graphics.position.y = track.valueScaleTransform.y;
  });

  track.animate();
};

/**
 * A track has received an event telling it to zoom along its
 * vertical axis. Update the transform describing the position
 * of its graphics.
 *
 * @param  {number} yPos        The position the zoom event took place
 * @param  {number} kMultiplier How much the zoom level should be adjusted by
 * @param  {d3.transform} transform   The track's current graphics transform.
 * @param  {number} height      The height of the track
 * @return {d3.transform}            The track's new graphics transform.
 */
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
  movedY,
};

export default trackUtils;
