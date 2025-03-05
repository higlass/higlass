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

    expect(trackRenderer.availableForPlugins.utils).toMatchInlineSnapshot(`
      {
        "DenseDataExtrema1D": [Function],
        "DenseDataExtrema2D": [Function],
        "IS_TRACK_RANGE_SELECTABLE": [Function],
        "absToChr": [Function],
        "changeOptions": [Function],
        "chrToAbs": [Function],
        "chromInfoBisector": [Function],
        "cloneEvent": [Function],
        "colorDomainToRgbaArray": [Function],
        "colorToHex": [Function],
        "colorToRgba": [Function],
        "dataToGenomicLoci": [Function],
        "debounce": [Function],
        "decToHexStr": [Function],
        "dictFromTuples": [Function],
        "dictItems": [Function],
        "dictKeys": [Function],
        "dictValues": [Function],
        "download": [Function],
        "expandCombinedTracks": [Function],
        "fillInMinWidths": [Function],
        "forwardEvent": [Function],
        "getAggregationFunction": [Function],
        "getDefaultTrackForDatatype": [Function],
        "getElementDim": [Function],
        "getTiledPlot": [Function],
        "getTrackByUid": [Function],
        "getTrackConfFromHGC": [Function],
        "getTrackObjById": [Function],
        "getTrackObjectFromHGC": [Function],
        "getTrackPositionByUid": [Function],
        "getTrackRenderer": [Function],
        "getXylofon": [Function],
        "gradient": [Function],
        "hasParent": [Function],
        "hexStrToInt": [Function],
        "isWithin": [Function],
        "maxNonZero": [Function],
        "minNonZero": [Function],
        "mountHGComponent": [Function],
        "mountHGComponentAsync": [Function],
        "ndarrayAssign": [Function],
        "ndarrayFlatten": [Function],
        "ndarrayToList": [Function],
        "numericifyVersion": [Function],
        "objVals": [Function],
        "parseChromsizesRows": [Function],
        "pixiTextToSvg": [Function],
        "removeHGComponent": [Function],
        "resetD3BrushStyle": [Function],
        "scalesCenterAndK": [Function],
        "scalesToGenomeLoci": [Function],
        "segmentsToRows": [Function],
        "selectedItemsToSize": [Function],
        "showMousePosition": [Function],
        "svgLine": [Function],
        "throttleAndDebounce": [Function],
        "timeout": [Function],
        "toVoid": [Function],
        "totalTrackPixelHeight": [Function],
        "trackUtils": {
          "calculate1DVisibleTiles": [Function],
          "calculate1DZoomLevel": [Function],
          "drawAxis": [Function],
          "getTilePosAndDimensions": [Function],
          "movedY": [Function],
          "stretchRects": [Function],
          "zoomedY": [Function],
        },
        "trimTrailingSlash": [Function],
        "valueToColor": [Function],
        "visitPositionedTracks": [Function],
        "visitTracks": [Function],
        "waitForJsonComplete": [Function],
        "waitForTilesLoaded": [Function],
        "waitForTransitionsFinished": [Function],
      }
    `);
  });

  afterEach(() => {
    if (api?.destroy) api.destroy();
    if (div) removeDiv(div);
    api = undefined;
    div = undefined;
  });
});
