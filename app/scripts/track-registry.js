import PixiTrack from './PixiTrack';
import HeatmapTiledPixiTrack from './HeatmapTiledPixiTrack';
import Id2DTiledPixiTrack from './Id2DTiledPixiTrack';
import IdHorizontal1DTiledPixiTrack from './IdHorizontal1DTiledPixiTrack';
import IdVertical1DTiledPixiTrack from './IdVertical1DTiledPixiTrack';
import TopAxisTrack from './TopAxisTrack';
import LeftAxisTrack from './LeftAxisTrack';
import CombinedTrack from './CombinedTrack';
import BedLikeTrack from './BedLikeTrack';
import OverlayTrack from './OverlayTrack';

import HorizontalLine1DPixiTrack from './HorizontalLine1DPixiTrack';
import HorizontalPoint1DPixiTrack from './HorizontalPoint1DPixiTrack';
import HorizontalMultivecTrack from './HorizontalMultivecTrack';
import BarTrack from './BarTrack';
import DivergentBarTrack from './DivergentBarTrack';
import Horizontal1dHeatmapTrack from './Horizontal1dHeatmapTrack';

import CNVIntervalTrack from './CNVIntervalTrack';
import LeftTrackModifier from './LeftTrackModifier';
import Track from './Track';
import HorizontalGeneAnnotationsTrack from './HorizontalGeneAnnotationsTrack';
import ArrowheadDomainsTrack from './ArrowheadDomainsTrack';
import Annotations2dTrack from './Annotations2dTrack';
import Annotations1dTrack from './Annotations1dTrack';

import Horizontal2DDomainsTrack from './Horizontal2DDomainsTrack';

import SquareMarkersTrack from './SquareMarkersTrack';
import Chromosome2DLabels from './Chromosome2DLabels';
import ChromosomeGrid from './ChromosomeGrid';
import Chromosome2DAnnotations from './Chromosome2DAnnotations';
import HorizontalChromosomeLabels from './HorizontalChromosomeLabels';

import HorizontalHeatmapTrack from './HorizontalHeatmapTrack';
import UnknownPixiTrack from './UnknownPixiTrack';
import ValueIntervalTrack from './ValueIntervalTrack';
import ViewportTracker2D from './ViewportTracker2D';
import ViewportTrackerHorizontal from './ViewportTrackerHorizontal';
import ViewportTrackerVertical from './ViewportTrackerVertical';

import HorizontalRule from './HorizontalRule';
import VerticalRule from './VerticalRule';
import CrossRule from './CrossRule';

import OSMTilesTrack from './OSMTilesTrack';
import OSMTileIdsTrack from './OSMTileIdsTrack';
import MapboxTilesTrack from './MapboxTilesTrack';
import RasterTilesTrack from './RasterTilesTrack';

import SVGTrack from './SVGTrack';

/** @type {Map<string, Factory} */
export const registry = new Map();

/**
 * @typedef {(this: { createTrackObject: unknown }, context, options, track) => Track} Factory
 */

/**
 *
 * @param {string[] | string} names
 * @param {Factory} factory
 */
function register(names, factory) {
  for (const name of Array.isArray(names) ? names : [names]) {
    registry.set(name, factory);
  }
}

register('left-axis', (ctx, opts) => new LeftAxisTrack(ctx, opts));
register('top-axis', (ctx, opts) => new TopAxisTrack(ctx, opts));
register('heatmap', (ctx, opts) => new HeatmapTiledPixiTrack(ctx, opts));
register(
  [
    'multivec',
    'vector-heatmap',
    'horizontal-multivec', // legacy, included for backwards compatiblity
    'horizontal-vector-heatmap', // legacy, included for backwards compatiblity
    'vertical-multivec', // legacy, included for backwards compatiblity
    'vertical-vector-heatmap', // legacy, included for backwards compatiblity
  ],
  (ctx, opts) => new HorizontalMultivecTrack(ctx, opts),
);
register(
  [
    '1d-heatmap',
    'horizontal-1d-heatmap', // legacy, included for backwards compatiblity
    'vertical-1d-heatmap', // legacy, included for backwards compatiblity
  ],
  (ctx, opts) => new Horizontal1dHeatmapTrack(ctx, opts),
);
register(
  [
    'line',
    'horizontal-line', // legacy, included for backwards compatiblity
    'vertical-line', // legacy, included for backwards compatiblity
  ],
  (ctx, opts) => new HorizontalLine1DPixiTrack(ctx, opts),
);
register(
  [
    'point',
    'horizontal-point', // legacy, included for backwards compatiblity
    'vertical-point', // legacy, included for backwards compatiblity
  ],
  (ctx, opts) => new HorizontalPoint1DPixiTrack(ctx, opts),
);
register(
  [
    'bar',
    'horizontal-bar', // legacy, included for backwards compatiblity
    'vertical-bar', // legacy, included for backwards compatiblity
  ],
  (ctx, opts) => new BarTrack(ctx, opts),
);
register(
  [
    'divergent-bar',
    'horizontal-divergent-bar', // legacy, included for backwards compatiblity
    'vertical-divergent-bar', // legacy, included for backwards compatiblity
  ],
  (ctx, opts) => new DivergentBarTrack(ctx, opts),
);
register(
  'horizontal-1d-tiles',
  (ctx, opts) => new IdHorizontal1DTiledPixiTrack(ctx, opts),
);
register(
  'vertical-1d-tiles',
  (ctx, opts) => new IdVertical1DTiledPixiTrack(ctx, opts),
);
register('2d-tiles', (ctx, opts) => new Id2DTiledPixiTrack(ctx, opts));
register(
  [
    'stacked-interval',
    'top-stacked-interval', // legacy, included for backwards compatiblity
    'left-stacked-interval', // legacy, included for backwards compatiblity
  ],
  (ctx, opts) => new CNVIntervalTrack(ctx, opts),
);
register('viewport-projection-center', (context, options, track) => {
  // TODO: Fix this so that these functions are defined somewhere else
  if (
    track.registerViewportChanged &&
    track.removeViewportChanged &&
    track.setDomainsCallback
  ) {
    context.removeViewportChanged = track.registerViewportChanged;
    context.removeViewportChanged = track.removeViewportChanged;
    context.setDomainsCallback = track.setDomainsCallback;
    return new ViewportTracker2D(context, options);
  }
  return new Track(context, options);
});
register('viewport-projection-horizontal', (context, options, track) => {
  // TODO: Fix this so that these functions are defined somewhere else
  if (
    track.registerViewportChanged &&
    track.removeViewportChanged &&
    track.setDomainsCallback
  ) {
    context.registerViewportChanged = track.registerViewportChanged;
    context.removeViewportChanged = track.removeViewportChanged;
    context.setDomainsCallback = track.setDomainsCallback;
    return new ViewportTrackerHorizontal(context, options);
  }
  return new Track(context, options);
});
register('viewport-projection-vertical', (context, options, track) => {
  // TODO: Fix this so that these functions are defined somewhere else
  if (
    track.registerViewportChanged &&
    track.removeViewportChanged &&
    track.setDomainsCallback
  ) {
    context.registerViewportChanged = track.registerViewportChanged;
    context.removeViewportChanged = track.removeViewportChanged;
    context.setDomainsCallback = track.setDomainsCallback;
    return new ViewportTrackerVertical(context, options);
  }
  return new Track(context, options);
});
register(
  [
    'gene-annotations',
    'horizontal-gene-annotations', // legacy, included for backwards compatiblity
    'vertical-gene-annotations', // legacy, included for backwards compatiblity
  ],
  (ctx, opts) => new HorizontalGeneAnnotationsTrack(ctx, opts),
);
register(
  ['2d-rectangle-domains', 'arrowhead-domains'],
  (ctx, opts) => new ArrowheadDomainsTrack(ctx, opts),
);
register(
  'horizontal-1d-annotations',
  (ctx, opts) => new Annotations1dTrack(ctx, opts),
);
// Fix this: LeftTrackModifier is doing a whole bunch of things not
// needed by this track but the current setup is not consistent.
register(
  'vertical-1d-annotations',
  (ctx, opts) => new Annotations1dTrack(ctx, opts, true),
);
register('2d-annotations', (ctx, opts) => new Annotations2dTrack(ctx, opts));
register(
  [
    'linear-2d-rectangle-domains',
    'horizontal-2d-rectangle-domains', // legacy, included for backwards compatiblity
    'vertical-2d-rectangle-domains', // legacy, included for backwards compatiblity
  ],
  (ctx, opts) => new Horizontal2DDomainsTrack(ctx, opts),
);
register('square-markers', (ctx, opts) => new SquareMarkersTrack(ctx, opts));
register('combined', function (context, options, track) {
  context.tracks = track.contents;
  context.createTrackObject = this.createTrackObject.bind(this);
  return new CombinedTrack(context, options);
});
register(
  '2d-chromosome-labels',
  (ctx, opts) => new Chromosome2DLabels(ctx, opts),
);
register('horizontal-chromosome-grid', (context, options) => {
  context.orientation = '1d-horizontal';
  return new ChromosomeGrid(context, options);
});
register('vertical-chromosome-grid', (context, options) => {
  context.orientation = '1d-vertical';
  return new ChromosomeGrid(context, options);
});
register('2d-chromosome-grid', (ctx, opts) => new ChromosomeGrid(ctx, opts));
// chromInfoPath is passed in for backwards compatibility
// it can be used to provide custom chromosome sizes
register(
  [
    'chromosome-labels',
    'horizontal-chromosome-labels', // legacy, included for backwards compatiblity
    'vertical-chromosome-labels', // legacy, included for backwards compatiblity
  ],
  (ctx, opts) => new HorizontalChromosomeLabels(ctx, opts),
);
register(
  [
    'linear-heatmap',
    'horizontal-heatmap', // legacy, included for backwards compatiblity
    'vertical-heatmap', // legacy, included for backwards compatiblity
  ],
  (ctx, opts) => new HorizontalHeatmapTrack(ctx, opts),
);
register(
  '2d-chromosome-annotations',
  (ctx, opts) => new Chromosome2DAnnotations(ctx, opts),
);
register(
  [
    '1d-value-interval',
    'horizontal-1d-value-interval', // legacy, included for backwards compatiblity
    'vertical-1d-value-interval', // legacy, included for backwards compatiblity
  ],
  (ctx, opts) => new ValueIntervalTrack(ctx, opts),
);
register(['osm', 'osm-tiles'], (ctx, opts) => new OSMTilesTrack(ctx, opts));
register('osm-2d-tile-ids', (ctx, opts) => new OSMTileIdsTrack(ctx, opts));
register(
  ['mapbox', 'mapbox-tiles'],
  (ctx, opts) => new MapboxTilesTrack(ctx, opts),
);
register('raster-tiles', (ctx, opts) => new RasterTilesTrack(ctx, opts));
register(
  [
    'bedlike',
    'vertical-bedlike', // legacy, included for backwards compatiblity
  ],
  (ctx, opts) => new BedLikeTrack(ctx, opts),
);
register('overlay-track', (ctx, opts) => new OverlayTrack(ctx, opts));
register('overlay-chromosome-grid-track', (ctx, opts) => {
  ctx.isOverlay = true;
  return new ChromosomeGrid(ctx, opts);
});
register('horizontal-rule', (ctx, opts) => new HorizontalRule(ctx, opts));
register('vertical-rule', (ctx, opts) => new VerticalRule(ctx, opts));
register('cross-rule', (ctx, opts, track) => {
  // This needs to be harmonized.
  ctx.x = track.x;
  ctx.y = track.y;
  return new CrossRule(ctx, opts);
});
register('simple-svg', (ctx, opts) => new SVGTrack(ctx, opts));
register('empty', (ctx, opts) => new PixiTrack(ctx, opts));
