// @ts-nocheck
import { afterEach, describe, expect, it } from 'vitest';

import { register } from './utils/DummyTrack';
import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';

import dummyTrackViewConf from './view-configs/dummy-track.json';

register();

describe('Plugin track tests', () => {
  let hgc = null;
  let api = null;
  let div = null;
  let viewConf;

  it('Should render', async () => {
    viewConf = dummyTrackViewConf;

    [div, api] = await createElementAndApi(viewConf, { bound: true });

    hgc = api.getComponent();

    const trackUid = viewConf.views[0].tracks.top[0].uid;

    const trackRenderer = hgc.tiledPlots[viewConf.views[0].uid].trackRenderer;
    const dummyTrack = trackRenderer.trackDefObjects[trackUid].trackObject;

    expect(trackRenderer.props.positionedTracks.length).to.equal(1);

    expect(dummyTrack.constructor.name).to.equal('DummyTrackClass');

    expect({ ...dummyTrack.hgc }).to.deep.equal(
      trackRenderer.availableForPlugins,
    );

    expect(trackRenderer.availableForPlugins.utils).to.have.deep.ordered.keys(
      'DenseDataExtrema1D',
      'DenseDataExtrema2D',
      'IS_TRACK_RANGE_SELECTABLE',
      'absToChr',
      'accessorTransposition',
      'addArrays',
      'addClass',
      'base64ToCanvas',
      'changeOptions',
      'chrToAbs',
      'chromInfoBisector',
      'cloneEvent',
      'colorDomainToRgbaArray',
      'colorToHex',
      'colorToRgba',
      'dataToGenomicLoci',
      'debounce',
      'decToHexStr',
      'dictFromTuples',
      'dictItems',
      'dictKeys',
      'dictValues',
      'download',
      'expandCombinedTracks',
      'fillInMinWidths',
      'flatten',
      'forEach',
      'forwardEvent',
      'genomeLociToPixels',
      'genomicRangeToChromosomeChunks',
      'getAggregationFunction',
      'getDefaultTrackForDatatype',
      'getDefaultTracksForDatatype',
      'getElementDim',
      'getTiledPlot',
      'getTrackByUid',
      'getTrackConfFromHGC',
      'getTrackObjById',
      'getTrackObjectFromHGC',
      'getTrackPositionByUid',
      'getTrackRenderer',
      'getXylofon',
      'gradient',
      'hasClass',
      'hasParent',
      'hexStrToInt',
      'intoTheVoid',
      'isTrackOrChildTrack',
      'isWithin',
      'latToY',
      'lngToX',
      'loadChromInfos',
      'map',
      'max',
      'maxNonZero',
      'min',
      'minNonZero',
      'mod',
      'mountHGComponent',
      'mountHGComponentAsync',
      'ndarrayAssign',
      'ndarrayFlatten',
      'ndarrayToList',
      'numericifyVersion',
      'objVals',
      'or',
      'parseChromsizesRows',
      'pixiTextToSvg',
      'q',
      'rangeQuery2d',
      'reduce',
      'relToAbsChromPos',
      'removeClass',
      'removeHGComponent',
      'resetD3BrushStyle',
      'rgbToHex',
      'scalesCenterAndK',
      'scalesToGenomeLoci',
      'segmentsToRows',
      'selectedItemsToSize',
      'showMousePosition',
      'some',
      'sum',
      'svgLine',
      'throttleAndDebounce',
      'tileToCanvas',
      'timeout',
      'toVoid',
      'totalTrackPixelHeight',
      'trackHeight',
      'trackUtils',
      'trackWidth',
      'trimTrailingSlash',
      'valueToColor',
      'visitPositionedTracks',
      'visitTracks',
      'waitForJsonComplete',
      'waitForTilesLoaded',
      'waitForTransitionsFinished',
    );
  });

  afterEach(() => {
    if (api?.destroy) api.destroy();
    if (div) removeDiv(div);
    api = undefined;
    div = undefined;
  });
});
