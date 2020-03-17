/* eslint-env node, jasmine, mocha */
import {
  configure
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

import FetchMockHelper from './utils/FetchMockHelper';

// Utils
import {
  mountHGComponent,
  removeHGComponent,
  getTrackObjectFromHGC
} from '../app/scripts/utils';

import viewConf from './view-configs/bedlike';

configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let hgc = null;
  let div = null;
  const fetchMockHelper = new FetchMockHelper(viewConf, 'BedLikeTests');

  describe('BedLikeTrack tests', () => {
    beforeAll(async done => {
      await fetchMockHelper.activateFetchMock();
      [div, hgc] = mountHGComponent(div, hgc, viewConf, done);
    });

    it('Ensures that the track was rendered', () => {
      expect(hgc.instance().state.viewConfig.editable).to.eql(true);
      const trackObj = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf.views[0].uid,
        viewConf.views[0].tracks.top[0].uid
      );

      expect(Object.keys(trackObj.drawnRects).length).to.be.above(0);
    });

    it('Checks that + and - strand entries are at different heights', () => {
      const trackObj = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf.views[0].uid,
        viewConf.views[0].tracks.top[0].uid
      );

      const rectHeights = new Set();
      for (const tileId in trackObj.drawnRects) {
        for (const uid in trackObj.drawnRects[tileId]) {
          const rect = trackObj.drawnRects[tileId][uid];

          rectHeights.add(rect[0][3]);
        }
      }

      expect(rectHeights.size).to.eql(2);
    });

    it('Exports to SVG', () => {
      const svgText = hgc.instance().createSVGString();

      const textIx = svgText.indexOf('text');
      const greenIx = svgText.indexOf('green');

      expect(textIx).to.be.above(0);
      expect(greenIx).to.be.below(0);
    });

    it('Checks minusStrandColor', done => {
      hgc.instance().state.views.aa.tracks.top[0].options.minusStrandColor =
        'green';

      hgc.setState(hgc.instance().state);
      hgc.update();

      const svgText = hgc.instance().createSVGString();
      const greenIx = svgText.indexOf('green');

      expect(greenIx).to.be.above(0);
      done();
    });

    it('Checks segment polygons', done => {
      hgc.instance().state.views.aa.tracks.top[0].options.annotationStyle =
        'segment';

      hgc.setState(hgc.instance().state);
      hgc.update();

      const trackObj = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf.views[0].uid,
        viewConf.views[0].tracks.top[0].uid
      );

      for (const tileId in trackObj.drawnRects) {
        for (const uid in trackObj.drawnRects[tileId]) {
          const rect = trackObj.drawnRects[tileId][uid];

          // the segment polygons have 12 vertices
          expect(rect[0].length).to.eql(24);
        }
      }

      done();
    });

    afterAll(async () => {
      await fetchMockHelper.storeDataAndResetFetchMock();
      removeHGComponent(div);
    });
  });
});
