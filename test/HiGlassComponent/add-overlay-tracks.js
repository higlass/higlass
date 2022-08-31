/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import {
  mountHGComponent,
  removeHGComponent,
  waitForJsonComplete,
} from '../../app/scripts/utils';

import { oneZoomedOutViewConf, chromosomeGridTrack } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

// import FetchMockHelper from '../utils/FetchMockHelper';

describe('Add overlay tracks', () => {
  let hgc = null;
  let div = null;
  // const fetchMockHelper = new FetchMockHelper(null, 'higlass.io');

  before((done) => {
    // await fetchMockHelper.activateFetchMock();
    [div, hgc] = mountHGComponent(div, hgc, oneZoomedOutViewConf, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: false,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
    // await fetchMockHelper.storeDataAndResetFetchMock();
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
