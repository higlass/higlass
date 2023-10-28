// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

import {
  mountHGComponent,
  removeHGComponent,
  // waitForTilesLoaded,
} from '../../app/scripts/test-helpers';

// import HeatmapOptions from '../../app/scripts/HeatmapOptions';

import { twoViewConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Colormap', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, twoViewConfig, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
  });

  // disabled to fix tests in #978
  // it('Ensures that the custom color map loads properly', (done) => {
  //   // console.log('heatmap options:', HeatmapOptions);

  //   hgc
  //     .instance()
  //     .tiledPlots.aa.handleConfigureTrack(
  //       twoViewConfig.views[0].tracks.center[0].contents[0],
  //       HeatmapOptions,
  //     );

  //   waitForTilesLoaded(hgc.instance(), done);
  // });
});
