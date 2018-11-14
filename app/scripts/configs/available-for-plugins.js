/**
 * Code that is available to plugin tracks.
 */

// Libraries
import * as PIXI from 'pixi.js';

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
import { LruCache } from '../factories';

// Services
import * as services from '../services';

// Utils
import * as utils from '../utils';

// Configs
import * as configs from '.';

const libraries = {
  PIXI,
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
  LruCache
};

export default {
  libraries,
  tracks,
  factories,
  services,
  utils,
  configs
};
