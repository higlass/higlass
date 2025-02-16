// @ts-nocheck
import * as vi from 'vitest';

import { register } from './utils/DummyDataFetcher';
import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';

import dummyDataFetcherViewConf from './view-configs/dummy-data-fetcher.json';

register();

vi.describe('Plugin data fetchers:', () => {
  let hgc = null;
  let api = null;
  let div = null;
  let viewConf;

  vi.describe('Dummy plugin data fetcher:', () => {
    vi.it('Should render', () => {
      viewConf = dummyDataFetcherViewConf;

      [div, api] = createElementAndApi(viewConf, { bound: true });

      hgc = api.getComponent();

      const trackUid = viewConf.views[0].tracks.top[0].uid;

      const trackRenderer = hgc.tiledPlots[viewConf.views[0].uid].trackRenderer;
      const dummyDataFetcher =
        trackRenderer.trackDefObjects[trackUid].trackObject.dataFetcher;

      vi.expect(dummyDataFetcher.constructor.name).to.equal(
        'DummyDataFetcherClass',
      );
      vi.expect(dummyDataFetcher.hgc).to.deep.equal(
        trackRenderer.availableForPlugins,
      );
    });

    vi.afterEach(() => {
      if (api?.destroy) api.destroy();
      if (div) removeDiv(div);
      api = undefined;
      div = undefined;
    });
  });
});
