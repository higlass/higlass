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
import Annotations2dTrack from '../Annotations2dTrack';
import ArrowheadDomainsTrack from '../ArrowheadDomainsTrack';
import BarTrack from '../BarTrack';
import BedLikeTrack from '../BedLikeTrack';
import CNVIntervalTrack from '../CNVIntervalTrack';
import CombinedTrack from '../CombinedTrack';
import DivergentBarTrack from '../DivergentBarTrack';
import HeatmapTiledPixiTrack from '../HeatmapTiledPixiTrack';
import Horizontal2DDomainsTrack from '../Horizontal2DDomainsTrack';
import HorizontalChromosomeLabels from '../HorizontalChromosomeLabels';
import HorizontalGeneAnnotationsTrack from '../HorizontalGeneAnnotationsTrack';
import HorizontalHeatmapTrack from '../HorizontalHeatmapTrack';
import HorizontalLine1DPixiTrack from '../HorizontalLine1DPixiTrack';
import HorizontalMultivecTrack from '../HorizontalMultivecTrack';
import HorizontalPoint1DPixiTrack from '../HorizontalPoint1DPixiTrack';
import HorizontalTiledPlot from '../HorizontalTiledPlot';
import HorizontalTrack from '../HorizontalTrack';
import Id2DTiledPixiTrack from '../Id2DTiledPixiTrack';
import IdHorizontal1DTiledPixiTrack from '../IdHorizontal1DTiledPixiTrack';
import IdVertical1DTiledPixiTrack from '../IdVertical1DTiledPixiTrack';
import LeftAxisTrack from '../LeftAxisTrack';
import MapboxTilesTrack from '../MapboxTilesTrack';
import MoveableTrack from '../MoveableTrack';
import OSMTilesTrack from '../OSMTilesTrack';
import PixiTrack from '../PixiTrack';
import SVGTrack from '../SVGTrack';
import SquareMarkersTrack from '../SquareMarkersTrack';
import Tiled1DPixiTrack from '../Tiled1DPixiTrack';
import TiledPixiTrack from '../TiledPixiTrack';
import TopAxisTrack from '../TopAxisTrack';
import Track from '../Track';
import ValueIntervalTrack from '../ValueIntervalTrack';
import VerticalTiled1DPixiTrack from '../VerticalTiled1DPixiTrack';
import VerticalTrack from '../VerticalTrack';

// Factories
import ContextMenuItem from '../ContextMenuItem';
import DataFetcher from '../DataFetcher';
import LruCache from '../factories';

// Services
import * as services from '../services';

// Chromosomes
import ChromosomeInfo from '../ChromosomeInfo';
import SearchField from '../SearchField';

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
  Annotations2dTrack,
  ArrowheadDomainsTrack,
  BarTrack,
  BedLikeTrack,
  CNVIntervalTrack,
  CombinedTrack,
  DivergentBarTrack,
  HeatmapTiledPixiTrack,
  Horizontal2DDomainsTrack,
  HorizontalChromosomeLabels,
  HorizontalGeneAnnotationsTrack,
  HorizontalHeatmapTrack,
  HorizontalLine1DPixiTrack,
  HorizontalMultivecTrack,
  HorizontalPoint1DPixiTrack,
  HorizontalTiledPlot,
  HorizontalTrack,
  Id2DTiledPixiTrack,
  IdHorizontal1DTiledPixiTrack,
  IdVertical1DTiledPixiTrack,
  LeftAxisTrack,
  MapboxTilesTrack,
  MoveableTrack,
  OSMTilesTrack,
  PixiTrack,
  SVGTrack,
  SquareMarkersTrack,
  Tiled1DPixiTrack,
  TiledPixiTrack,
  TopAxisTrack,
  Track,
  ValueIntervalTrack,
  VerticalTiled1DPixiTrack,
  VerticalTrack,
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

export default {
  chromosomes,
  libraries,
  tracks,
  factories,
  services,
  utils,
  configs,
  // Defined globally by webpack.
  VERSION,
};
