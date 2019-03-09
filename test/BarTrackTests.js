/* eslint-env node, jasmine, mocha */
import {
  configure,
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

// Utils
import {
  colorToHex,
  mountHGComponent,
  removeHGComponent,
  getTrackObjectFromHGC,
  waitForTilesLoaded
} from '../app/scripts/utils';

import viewConf from './view-configs/bar';


configure({ adapter: new Adapter() });

describe('BarTrack tests', () => {
  let hgc = null;
  let div = null;

  beforeAll((done) => {
    ([div, hgc] = mountHGComponent(div, hgc, viewConf, done));
  });

  it('Ensures that the track was rendered', (done) => {
    expect(hgc.instance().state.viewConfig.editable).to.eql(true);

    const trackConf = viewConf.views[0].tracks.top[0];

    const trackObj = getTrackObjectFromHGC(
      hgc.instance(),
      viewConf.views[0].uid,
      trackConf.uid
    );

    waitForTilesLoaded(hgc.instance(), () => {
      expect(trackObj.zeroLine.fillColor)
        .to.eql(colorToHex(trackConf.options.zeroLineColor));

      expect(trackObj.zeroLine.fillAlpha)
        .to.eql(trackConf.options.zeroLineOpacity);

      expect(
        Object.values(trackObj.fetchedTiles).every(tile => tile.svgData)
      ).to.eql(true);
    });

    done();
  });

  afterAll((done) => {
    removeHGComponent(div);
    done();
  });
});
