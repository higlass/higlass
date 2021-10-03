/* eslint-env node, jasmine, mocha */
import {
  configure,
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

// Utils
import {
  mountHGComponent,
  removeHGComponent,
  getTrackObjectFromHGC,
  waitForTilesLoaded,
} from '../app/scripts/utils';

import viewConf from './view-configs/line-with-nans';

configure({ adapter: new Adapter() });

describe('BarTrack tests', () => {
  let hgc = null;
  let div = null;

  beforeAll((done) => {
    [div, hgc] = mountHGComponent(div, hgc, viewConf, done);
  });

  it('Ensures that the track renders with nan gaps', (done) => {
    expect(hgc.instance().state.viewConfig.editable).to.eql(true);

    const trackConf = viewConf.views[0].tracks.top[1];

    const trackObj = getTrackObjectFromHGC(
      hgc.instance(),
      viewConf.views[0].uid,
      trackConf.uid,
    );

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

      done();
    });
  });

  afterAll(() => {
    removeHGComponent(div);
  });
});
