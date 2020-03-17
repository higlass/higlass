/* eslint-env node, jasmine */

import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';
import { register } from './utils/DummyTrack';
import FetchMockHelper from './utils/FetchMockHelper';

import dummyTrackViewConf from './view-configs/dummy-track';

register();

describe('Overlay Track:', () => {
  let hgc = null;
  let api = null;
  let div = null;
  let viewConf;
  const fetchMockHelper = new FetchMockHelper(
    dummyTrackViewConf,
    'PluginTrackTest'
  );

  beforeAll(async () => {
    await fetchMockHelper.activateFetchMock();
  });

  describe('Annotation overlays:', () => {
    it('Should render', () => {
      viewConf = dummyTrackViewConf;

      [div, api] = createElementAndApi(viewConf, { bound: true });

      hgc = api.getComponent();

      const trackUid = viewConf.views[0].tracks.top[0].uid;

      const trackRenderer = hgc.tiledPlots[viewConf.views[0].uid].trackRenderer;
      const dummyTrack = trackRenderer.trackDefObjects[trackUid].trackObject;

      expect(trackRenderer.props.positionedTracks.length).toEqual(1);

      expect(dummyTrack.constructor.name).toEqual('DummyTrackClass');

      expect(dummyTrack.hgc).toEqual(trackRenderer.availableForPlugins);
    });

    afterEach(() => {
      if (api && api.destroy) api.destroy();
      if (div) removeDiv(div);
      api = undefined;
      div = undefined;
    });
  });

  afterAll(async () => {
    await fetchMockHelper.storeDataAndResetFetchMock();
  });
});
