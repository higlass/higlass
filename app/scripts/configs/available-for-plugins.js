/**
 * Code that is available to plugin tracks.
 */

// Libraries
import * as d3Array from 'd3-array';
import * as d3Axis from 'd3-axis';
import * as d3Brush from 'd3-brush';
import * as d3Color from 'd3-color';
import * as d3Drag from 'd3-drag';
import * as d3Dsv from 'd3-dsv';
import * as d3Format from 'd3-format';
import * as d3Geo from 'd3-geo';
import * as d3Queue from 'd3-queue';
import * as d3Request from 'd3-request';
import * as d3Scale from 'd3-scale';
import * as d3Selection from 'd3-selection';
import * as d3Transition from 'd3-transition';
import * as d3Zoom from 'd3-zoom';

import slugid from 'slugid';
import { mix } from '../mixwith';

// Configs
import * as configs from '.';

// Utils
import * as utils from '../utils';

// Tracks
import Annotations1dTrack from '../Annotations1dTrack';
import Annotations2dTrack from '../Annotations2dTrack';
import ArrowheadDomainsTrack from '../ArrowheadDomainsTrack';
import BarTrack from '../BarTrack';
import BedLikeTrack from '../BedLikeTrack';
import CNVIntervalTrack from '../CNVIntervalTrack';
import Chromosome2DAnnotations from '../Chromosome2DAnnotations';
import Chromosome2DLabels from '../Chromosome2DLabels';
import ChromosomeGrid from '../ChromosomeGrid';
import CombinedTrack from '../CombinedTrack';
import CrossRule from '../CrossRule';
import DivergentBarTrack from '../DivergentBarTrack';
import HeatmapTiledPixiTrack from '../HeatmapTiledPixiTrack';
import Horizontal1dHeatmapTrack from '../Horizontal1dHeatmapTrack';
import Horizontal2DDomainsTrack from '../Horizontal2DDomainsTrack';
import HorizontalChromosomeLabels from '../HorizontalChromosomeLabels';
import HorizontalGeneAnnotationsTrack from '../HorizontalGeneAnnotationsTrack';
import HorizontalHeatmapTrack from '../HorizontalHeatmapTrack';
import HorizontalLine1DPixiTrack from '../HorizontalLine1DPixiTrack';
import HorizontalMultivecTrack from '../HorizontalMultivecTrack';
import HorizontalPoint1DPixiTrack from '../HorizontalPoint1DPixiTrack';
import HorizontalRule from '../HorizontalRule';
import HorizontalTiled1DPixiTrack from '../HorizontalTiled1DPixiTrack';
import HorizontalTiledPlot from '../HorizontalTiledPlot';
import HorizontalTrack from '../HorizontalTrack';
import Id2DTiledPixiTrack from '../Id2DTiledPixiTrack';
import IdHorizontal1DTiledPixiTrack from '../IdHorizontal1DTiledPixiTrack';
import IdVertical1DTiledPixiTrack from '../IdVertical1DTiledPixiTrack';
import LeftAxisTrack from '../LeftAxisTrack';
import MapboxTilesTrack from '../MapboxTilesTrack';
import MoveableTrack from '../MoveableTrack';
import OSMTileIdsTrack from '../OSMTileIdsTrack';
import OSMTilesTrack from '../OSMTilesTrack';
import OverlayTrack from '../OverlayTrack';
import PixiTrack from '../PixiTrack';
import RasterTilesTrack from '../RasterTilesTrack';
import SVGTrack from '../SVGTrack';
import SquareMarkersTrack from '../SquareMarkersTrack';
import Tiled1DPixiTrack from '../Tiled1DPixiTrack';
import TiledPixiTrack from '../TiledPixiTrack';
import TopAxisTrack from '../TopAxisTrack';
import Track from '../Track';
import ValueIntervalTrack from '../ValueIntervalTrack';
import VerticalRule from '../VerticalRule';
import VerticalTiled1DPixiTrack from '../VerticalTiled1DPixiTrack';
import VerticalTrack from '../VerticalTrack';
import ViewportTracker2D from '../ViewportTracker2D';
import ViewportTracker2DPixi from '../ViewportTracker2DPixi';
import ViewportTrackerHorizontal from '../ViewportTrackerHorizontal';
import ViewportTrackerVertical from '../ViewportTrackerVertical';

// Factories
import ContextMenuItem from '../ContextMenuItem';
import DataFetcher from '../DataFetcher';
import LruCache from '../factories';

// Services
import * as services from '../services';

// Chromosomes
import ChromosomeInfo from '../ChromosomeInfo';
import SearchField from '../SearchField';

// Data Fetchers
import GBKDataFetcher from '../data-fetchers/genbank-fetcher';
import LocalDataFetcher from '../data-fetchers/local-tile-fetcher';
import getDataFetcher from '../data-fetchers/get-data-fetcher';

const libraries = {
  d3Array,
  d3Axis,
  d3Brush,
  d3Color,
  d3Drag,
  d3Dsv,
  d3Format,
  d3Geo,
  d3Queue,
  d3Request,
  d3Scale,
  d3Selection,
  d3Transition,
  d3Zoom,
  PIXI: configs.GLOBALS.PIXI,
  mix,
  slugid,
};

const tracks = {
  Annotations1dTrack,
  Annotations2dTrack,
  ArrowheadDomainsTrack,
  BarTrack,
  BedLikeTrack,
  CNVIntervalTrack,
  Chromosome2DAnnotations,
  Chromosome2DLabels,
  ChromosomeGrid,
  CombinedTrack,
  CrossRule,
  DivergentBarTrack,
  HeatmapTiledPixiTrack,
  Horizontal1dHeatmapTrack,
  Horizontal2DDomainsTrack,
  HorizontalChromosomeLabels,
  HorizontalGeneAnnotationsTrack,
  HorizontalHeatmapTrack,
  HorizontalLine1DPixiTrack,
  HorizontalMultivecTrack,
  HorizontalPoint1DPixiTrack,
  HorizontalRule,
  HorizontalTiled1DPixiTrack,
  HorizontalTiledPlot,
  HorizontalTrack,
  Id2DTiledPixiTrack,
  IdHorizontal1DTiledPixiTrack,
  IdVertical1DTiledPixiTrack,
  LeftAxisTrack,
  MapboxTilesTrack,
  MoveableTrack,
  OSMTileIdsTrack,
  OSMTilesTrack,
  OverlayTrack,
  PixiTrack,
  RasterTilesTrack,
  SVGTrack,
  SquareMarkersTrack,
  Tiled1DPixiTrack,
  TiledPixiTrack,
  TopAxisTrack,
  Track,
  ValueIntervalTrack,
  VerticalRule,
  VerticalTiled1DPixiTrack,
  VerticalTrack,
  ViewportTracker2D,
  ViewportTracker2DPixi,
  ViewportTrackerHorizontal,
  ViewportTrackerVertical,
};

const factories = {
  ContextMenuItem,
  DataFetcher,
  LruCache,
};

const chromosomes = {
  ChromosomeInfo,
  SearchField,
};

const dataFetchers = {
  DataFetcher,
  GBKDataFetcher,
  LocalDataFetcher,
  getDataFetcher,
};

export default {
  chromosomes,
  libraries,
  tracks,
  dataFetchers,
  factories,
  services,
  utils,
  configs,
  // Defined globally by webpack.
  VERSION,
};
