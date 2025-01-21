// @ts-nocheck
import { afterAll, beforeAll, describe, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

// Utils
import {
  mountHGComponentAsync,
  removeHGComponent,
  waitForTilesLoaded,
  waitForTransitionsFinished,
} from '../app/scripts/test-helpers';

import { getTrackObjectFromHGC } from '../app/scripts/utils';

import { simpleCenterViewConfig } from './view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let hgc = null;
  let div = null;

  describe('Tiled Pixi Track Tests', () => {
    beforeAll(async () => {
      [div, hgc] = await mountHGComponentAsync(
        div,
        hgc,
        simpleCenterViewConfig,
        {
          style: 'width:800px; height:800px; background-color: lightgreen',
          bounded: true,
        },
      );
    });

    afterAll(() => {
      removeHGComponent(div);
    });

    it('Ensure we can set a dataChanged listener', async () => {
      const trackObject = getTrackObjectFromHGC(hgc.instance(), 'heatmap1');

      const dataChangedCb = () => {};

      trackObject.on('dataChanged', dataChangedCb);

      hgc
        .instance()
        .zoomTo('a', 100000000, 200000000, 100000000, 200000000, 1000);

      await new Promise((done) => {
        waitForTransitionsFinished(hgc.instance(), () => {
          waitForTilesLoaded(hgc.instance(), () => {
            trackObject.off('dataChanged', dataChangedCb);
            done(null);
          });
        });
      });
    });
  });
});
