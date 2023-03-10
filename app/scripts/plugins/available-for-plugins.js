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
import * as configs from '../configs';

// Utils
import * as utils from '../utils';

// Tracks
import * as tracks from '../tracks';

// Factories
import ContextMenuItem from '../ui-components/ContextMenuItem';
import LruCache from '../utils/LruCache';

// Services
import * as services from '../services';

// Chromosomes
import ChromosomeInfo from '../ChromosomeInfo';
import SearchField from '../SearchField';

// Data Fetchers
import {
  DataFetcher,
  GBKDataFetcher,
  LocalDataFetcher,
} from '../data-fetchers';
import getDataFetcher from './get-data-fetcher';

import { version } from '../../../package.json';

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
  VERSION: version,
};
