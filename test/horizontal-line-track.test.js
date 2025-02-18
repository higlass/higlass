import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';
// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Utils
import {
  getTrackObjectFromHGC,
  mountHGComponentAsync,
  removeHGComponent,
  waitForTilesLoaded,
} from '../app/scripts/utils';

import viewConf from './view-configs/line-with-nans.json';

Enzyme.configure({ adapter: new Adapter() });

describe('BarTrack tests', () => {
  let hgc = null;
  let div = null;

  beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, viewConf);
  });

  it('Ensures that the track renders with nan gaps', () => {
    expect(hgc.instance().state.viewConfig.editable).to.eql(true);

    const trackConf = viewConf.views[0].tracks.top[1];

    const trackObj = getTrackObjectFromHGC(
      hgc.instance(),
      viewConf.views[0].uid,
      trackConf.uid,
    );

    return new Promise((done) => {
      waitForTilesLoaded(hgc.instance(), () => {
        // The default options don't have nanAsZero set so we exepct to have
        // 17 different segments (a segment is a continuous run of line).
        expect(trackObj.fetchedTiles['22.1771446'].segments.length).to.eql(17);

        // Next we'll set the nanAsZero option.
        hgc
          .instance()
          .handleTrackOptionsChanged(
            'NWXhqn1NSimULWUxK2vI4g',
            'AwiBEfdrQ5-0ZWSWhlI_rg',
            {
              nanAsZero: true,
            },
          );
        hgc.update();

        // And now we'll check to make sure that there's one segment
        // (which connects all of the points).
        expect(trackObj.fetchedTiles['22.1771446'].segments.length).to.eql(1);

        done(null);
      });
    });
  });

  afterAll(() => {
    removeHGComponent(div);
  });
});
