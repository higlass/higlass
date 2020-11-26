import { configure } from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import {
  mountHGComponent,
  removeHGComponent,
  waitForJsonComplete,
} from '../../app/scripts/utils';

import { oneZoomedOutViewConf, chromosomeGridTrack } from '../view-configs';

configure({ adapter: new Adapter() });

// import FetchMockHelper from '../utils/FetchMockHelper';

describe('Add overlay tracks', () => {
  let hgc = null;
  let div = null;
  // const fetchMockHelper = new FetchMockHelper(null, 'higlass.io');

  beforeAll(async (done) => {
    // await fetchMockHelper.activateFetchMock();
    [div, hgc] = mountHGComponent(div, hgc, oneZoomedOutViewConf, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: false,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  afterAll(async () => {
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

    expect(outputJSON.views[0].tracks.center[0].contents).toBeDefined();

    // should have two tracks
    expect(
      outputJSON.views[0].tracks.center[0].contents.length,
    ).toBeGreaterThan(1);

    waitForJsonComplete(done);
  });
});
