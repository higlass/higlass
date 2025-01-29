// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

// Utils
import {
  mountHGComponentAsync,
  removeHGComponent,
  waitForTilesLoaded,
} from '../app/scripts/test-helpers';
import { colorToHex, getTrackObjectFromHGC } from '../app/scripts/utils';

import viewConf from './view-configs/bar.json';

Enzyme.configure({ adapter: new Adapter() });

describe('BarTrack tests', () => {
  let hgc = null;
  let div = null;

  beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, viewConf);
  });

  it('Ensures that the track was rendered', async () => {
    expect(hgc.instance().state.viewConfig.editable).to.eql(true);

    const trackConf = viewConf.views[0].tracks.top[0];

    const trackObj = getTrackObjectFromHGC(
      hgc.instance(),
      viewConf.views[0].uid,
      trackConf.uid,
    );

    await new Promise((done) => {
      waitForTilesLoaded(hgc.instance(), () => {
        expect(trackObj.zeroLine.fill.color).to.eql(
          colorToHex(trackConf.options.zeroLineColor),
        );

        expect(trackObj.zeroLine.fill.alpha).to.eql(
          trackConf.options.zeroLineOpacity,
        );

        expect(
          Object.values(trackObj.fetchedTiles).every((tile) => tile.svgData),
        ).to.eql(true);
        done(null);
      });
    });
  });

  it('Ensures that the cross section bar track was rendered', async () => {
    const trackConf = viewConf.views[0].tracks.left[0];

    const trackObj = getTrackObjectFromHGC(
      hgc.instance(),
      viewConf.views[0].uid,
      trackConf.uid,
    );

    await new Promise((done) => {
      waitForTilesLoaded(hgc.instance(), () => {
        expect(
          Object.values(trackObj.originalTrack.fetchedTiles).every(
            (tile) => tile.svgData,
          ),
        ).to.eql(true);
        done(null);
      });
    });
  });

  afterAll(() => {
    removeHGComponent(div);
  });
});
