/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import {
  mountHGComponent,
  removeHGComponent,
  waitForTilesLoaded,
  getTrackObjectFromHGC,
  getTiledPlot,
} from '../../app/scripts/utils';

import { oneTrackConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

// import FetchMockHelper from '../utils/FetchMockHelper';

describe('Track Resizing', () => {
  let hgc = null;
  let div = null;
  // const fetchMockHelper = new FetchMockHelper(null, 'higlass.io');

  before((done) => {
    // await fetchMockHelper.activateFetchMock();
    [div, hgc] = mountHGComponent(div, hgc, oneTrackConfig, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
    // await fetchMockHelper.storeDataAndResetFetchMock();
  });

  it('Resizes one track ', (done) => {
    const tp = getTiledPlot(hgc.instance(), 'aa');

    tp.handleResizeTrack('line1', 289, 49);

    // tp.setState(tp.state);
    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Ensures that the track object was resized', (done) => {
    const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1');

    expect(track.dimensions[1]).to.equal(49);

    waitForTilesLoaded(hgc.instance(), done);
  });
});
