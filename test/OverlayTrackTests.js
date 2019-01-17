/* eslint-env node, jasmine */

// Utils
// import {
//   getTrackObjectFromHGC,
//   waitForTilesLoaded
// } from '../app/scripts/utils';

import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';

import overlayAnnotations1d2dViewConf from './view-configs/overlay-annotations-1d-2d';

describe('Overlay Track:', () => {
  let hgc = null;
  let api = null;
  let div = null;
  let viewConf;

  describe('Annotation overlays:', () => {
    it('Should render', (done) => {
      viewConf = overlayAnnotations1d2dViewConf;

      [div, api] = createElementAndApi(viewConf, { bound: true });

      hgc = api.getComponent();

      const numNormalTracks = viewConf.views[0].tracks.top.length
        + viewConf.views[0].tracks.right.length
        + viewConf.views[0].tracks.bottom.length
        + viewConf.views[0].tracks.left.length
        + viewConf.views[0].tracks.center.length;

      expect(numNormalTracks).toEqual(4);

      const posTracks = hgc.tiledPlots[viewConf.views[0].uid]
        .trackRenderer.props.positionedTracks;

      expect(posTracks.length).toEqual(5);

      const overlayTrack = posTracks[posTracks.length - 1];

      expect(overlayTrack.track.type).toEqual('overlay-track');

      done();
    });

    afterEach(() => {
      if (api && api.destroy) api.destroy();
      if (div) removeDiv(div);
      api = undefined;
      div = undefined;
    });
  });
});
