// @ts-nocheck
/* eslint-env mocha */
import { expect } from 'chai';

// Utils
import { waitForTilesLoaded } from '../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../app/scripts/utils';

import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';

import horizontal1dLineTrackWithConstViewConf from './view-configs/horizontal-1d-line-track-with-const.json';
import { horizontalLineEnd } from './view-configs';

describe('Horizontal 1D track tests', () => {
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
        viewConf.views[0].tracks.top[0].uid,
      );

      waitForTilesLoaded(hgc, () => {
        expect(trackObj.constIndicator.children.length).to.equal(3);
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

  describe('Horizontal1DLineTrack with const indicator', () => {
    it('check that the const indicators were rendered', (done) => {
      viewConf = horizontalLineEnd;

      [div, api] = createElementAndApi(viewConf, { bound: true });

      hgc = api.getComponent();

      const trackObj = getTrackObjectFromHGC(
        hgc,
        viewConf.views[0].uid,
        viewConf.views[0].tracks.top[1].uid,
      );

      const trackObjGeneAnnotations = getTrackObjectFromHGC(
        hgc,
        viewConf.views[0].uid,
        viewConf.views[0].tracks.top[2].uid,
      );

      waitForTilesLoaded(hgc, () => {
        // this should be
        expect(trackObj.getDataAtPos(366)).not.to.equal(null);

        // should be beyond the end of the data array because
        // it's past the end of the last tile
        expect(trackObj.getDataAtPos(366)).to.equal(undefined);

        // gene annotations don't currently have a mouseover function
        expect(trackObjGeneAnnotations.getDataAtPos(10)).to.equal(null);
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
