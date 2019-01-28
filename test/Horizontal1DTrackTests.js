/* eslint-env node, jasmine */

// Utils
import {
  getTrackObjectFromHGC,
  waitForTilesLoaded
} from '../app/scripts/utils';

import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';

import horizontal1dLineTrackWithConstViewConf from './view-configs/horizontal-1d-line-track-with-const';

describe('Simple HiGlassComponent', () => {
  let hgc = null;
  let api = null;
  let div = null;
  let viewConf;

  describe('Horizontal1DLineTrack with const indicator', () => {
    it('check that the const indicators were rendered', (done) => {
      viewConf = horizontal1dLineTrackWithConstViewConf;

      [div, api] = createElementAndApi(viewConf, { bound: true });

      hgc = api.getComponent();

      const trackObj = getTrackObjectFromHGC(
        hgc,
        viewConf.views[0].uid,
        viewConf.views[0].tracks.top[0].uid
      );

      waitForTilesLoaded(hgc, () => {
        expect(trackObj.constIndicator.children.length).toEqual(3);
        done();
      });
    });

    afterEach(() => {
      if (api && api.destroy) api.destroy();
      if (div) removeDiv(div);
      api = undefined;
      div = undefined;
    });
  });
});
