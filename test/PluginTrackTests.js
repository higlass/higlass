/* eslint-env node, jasmine */

import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';
import { register } from './utils/DummyTrack';

import dummyTrackViewConf from './view-configs/dummy-track';

register();

describe('Overlay Track:', () => {
  let hgc = null;
  let api = null;
  let div = null;
  let viewConf;

  describe('Annotation overlays:', () => {
    it('Should render', (done) => {
      viewConf = dummyTrackViewConf;

      [div, api] = createElementAndApi(viewConf, { bound: true });

      hgc = api.getComponent();

      const trackUid = viewConf.views[0].tracks.top[0].uid;

      const trackRenderer = hgc.tiledPlots[viewConf.views[0].uid]
        .trackRenderer;
      const dummyTrack = trackRenderer.trackDefObjects[trackUid].trackObject;

      expect(trackRenderer.props.positionedTracks.length).toEqual(1);

      expect(dummyTrack.constructor.name).toEqual('DummyTrackClass');

      expect(dummyTrack.hgc).toEqual(trackRenderer.availableForPlugins);

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
