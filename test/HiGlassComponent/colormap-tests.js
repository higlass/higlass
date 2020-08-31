import { configure } from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import {
  mountHGComponent,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/utils';

import HeatmapOptions from '../../app/scripts/HeatmapOptions';

import { twoViewConfig } from '../view-configs';

configure({ adapter: new Adapter() });

// import FetchMockHelper from '../utils/FetchMockHelper';

describe('Colormap', () => {
  let hgc = null;
  let div = null;
  // const fetchMockHelper = new FetchMockHelper(null, 'higlass.io');

  beforeAll(async (done) => {
    // await fetchMockHelper.activateFetchMock();
    [div, hgc] = mountHGComponent(div, hgc, twoViewConfig, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  afterAll(async () => {
    removeHGComponent(div);
    // await fetchMockHelper.storeDataAndResetFetchMock();
  });

  it('Ensures that the custom color map loads properly', (done) => {
    // console.log('heatmap options:', HeatmapOptions);

    hgc
      .instance()
      .tiledPlots.aa.handleConfigureTrack(
        twoViewConfig.views[0].tracks.center[0].contents[0],
        HeatmapOptions,
      );

    waitForTilesLoaded(hgc.instance(), done);
  });
});
