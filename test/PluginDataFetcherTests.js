// @ts-nocheck
/* eslint-env mocha */
import { expect } from 'chai';

import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';
import { register } from './utils/DummyDataFetcher';

import dummyDataFetcherViewConf from './view-configs/dummy-data-fetcher.json';

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

      expect(dummyDataFetcher.constructor.name).to.equal(
        'DummyDataFetcherClass',
      );
      expect(dummyDataFetcher.hgc).to.deep.equal(
        trackRenderer.availableForPlugins,
      );
    });

    afterEach(() => {
      if (api && api.destroy) api.destroy();
      if (div) removeDiv(div);
      api = undefined;
      div = undefined;
    });
  });
});
