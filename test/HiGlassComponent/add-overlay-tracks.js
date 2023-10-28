// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import {
  mountHGComponent,
  removeHGComponent,
  waitForJsonComplete,
} from '../../app/scripts/test-helpers';

import { oneZoomedOutViewConf, chromosomeGridTrack } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Add overlay tracks', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, oneZoomedOutViewConf, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: false,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
  });

  it('Add the grid', (done) => {
    hgc.instance().handleTracksAdded('aa', [chromosomeGridTrack], 'center');

    hgc.instance().setState(hgc.instance().state);

    waitForJsonComplete(done);
  });

  it('Should show a grid', (done) => {
    const outputJSON = JSON.parse(hgc.instance().getViewsAsString());

    expect(outputJSON.views[0].tracks.center[0].contents).to.exist;

    // should have two tracks
    expect(
      outputJSON.views[0].tracks.center[0].contents.length,
    ).to.be.greaterThan(1);

    waitForJsonComplete(done);
  });
});
