/* eslint-env node, jasmine */

import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';
import { register } from './utils/DummyDataFetcher';

import dummyDataFetcherViewConf from './view-configs/dummy-data-fetcher';

register();

describe('Plugin data fetchers:', () => {
  let hgc = null;
  let api = null;
  let div = null;
  let viewConf;

  describe('Dummy plugin data fetcher:', () => {
    it('Should render', () => {
      viewConf = dummyDataFetcherViewConf;

      [div, api] = createElementAndApi(viewConf, { bound: true });

      hgc = api.getComponent();

      const trackUid = viewConf.views[0].tracks.top[0].uid;

      const trackRenderer = hgc.tiledPlots[viewConf.views[0].uid].trackRenderer;
      const dummyDataFetcher =
        trackRenderer.trackDefObjects[trackUid].trackObject.dataFetcher;

      expect(dummyDataFetcher.constructor.name).toEqual(
        'DummyDataFetcherClass',
      );
      expect(dummyDataFetcher.hgc).toEqual(trackRenderer.availableForPlugins);
    });

    afterEach(() => {
      if (api && api.destroy) api.destroy();
      if (div) removeDiv(div);
      api = undefined;
      div = undefined;
    });
  });
});
