/* eslint-env mocha */
import { expect } from 'chai';

import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';
import { register } from './utils/DummyTrack';

import dummyTrackViewConf from './view-configs/dummy-track.json';

register();

describe('Plugin track tests', () => {
  let hgc = null;
  let api = null;
  let div = null;
  let viewConf;

  it('Should render', () => {
    viewConf = dummyTrackViewConf;

    [div, api] = createElementAndApi(viewConf, { bound: true });

    hgc = api.getComponent();

    const trackUid = viewConf.views[0].tracks.top[0].uid;

    const trackRenderer = hgc.tiledPlots[viewConf.views[0].uid].trackRenderer;
    const dummyTrack = trackRenderer.trackDefObjects[trackUid].trackObject;

    expect(trackRenderer.props.positionedTracks.length).to.equal(1);

    expect(dummyTrack.constructor.name).to.equal('DummyTrackClass');

    expect({ ...dummyTrack.hgc }).to.deep.equal(
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
