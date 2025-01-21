// @ts-nocheck
import { afterAll, beforeAll, describe, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/test-helpers';

import HeatmapOptions from '../../app/scripts/HeatmapOptions';

import { twoViewConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Colormap', () => {
  let hgc = null;
  let div = null;

  beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, twoViewConfig, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  afterAll(async () => {
    removeHGComponent(div);
  });

  it('Ensures that the custom color map loads properly', async (done) => {
    hgc
      .instance()
      .tiledPlots.aa.handleConfigureTrack(
        twoViewConfig.views[0].tracks.center[0].contents[0],
        HeatmapOptions,
      );

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
});
