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

describe('BedLikeTest', () => {
  const fetchMockHelper = new FetchMockHelper('', 'BedLikeTests');

  beforeAll(async () => {
    await fetchMockHelper.activateFetchMock();
  });

  describe('BedLikeTrack tests', () => {
    let hgc = null;
    let div = null;

    beforeAll(done => {
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

    it('Checks to make sure that scaled height changes the height of drawn rects', () => {
      // const currentHeight =
      const trackObj = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf.views[0].uid,
        viewConf.views[0].tracks.top[0].uid
      );

      let drawnRects = Object.values(trackObj.drawnRects[13])[0][0];
      const prevHeight = drawnRects[5] - drawnRects[3];

      // switch to scaled height
      hgc.instance().state.views.aa.tracks.top[0].options.annotationHeight =
        'scaled';

      hgc.setState(hgc.instance().state);
      hgc.update();

      drawnRects = Object.values(trackObj.drawnRects[13])[0][0];
      const nextHeight = drawnRects[5] - drawnRects[3];

      // make sure the height of the drawn rects actually changed
      expect(nextHeight).to.not.eql(prevHeight);

      // switch back to the original height
      hgc.instance().state.views.aa.tracks.top[0].options.annotationHeight = 8;

      hgc.setState(hgc.instance().state);
      hgc.update();

      drawnRects = Object.values(trackObj.drawnRects[13])[0][0];
      const finalHeight = drawnRects[5] - drawnRects[3];

      expect(finalHeight).to.eql(prevHeight);

      // set the maximum annotation height
      //
      hgc.instance().state.views.aa.tracks.top[0].options.maxAnnotationHeight = 8;
      hgc.instance().state.views.aa.tracks.top[0].options.annotationHeight =
        'scaled';

      hgc.setState(hgc.instance().state);
      hgc.update();

      drawnRects = Object.values(trackObj.drawnRects[13])[0][0];
      const finalestHeight = drawnRects[5] - drawnRects[3];

      expect(finalestHeight).to.eql(prevHeight);
    });

    it('Checks to make sure font size increases', () => {
      const trackObj = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf.views[0].uid,
        viewConf.views[0].tracks.top[0].uid
      );

      const prevHeight = Object.values(trackObj.fetchedTiles)[0].textHeights
        .CTCF_known1;
      hgc.instance().state.views.aa.tracks.top[0].options.fontSize = 20;

      hgc.setState(hgc.instance().state);
      hgc.update();

      const newHeight = Object.values(trackObj.fetchedTiles)[0].textHeights
        .CTCF_known1;

      expect(newHeight).to.be.above(prevHeight);
    });

    it('Changes the color encoding of the annotations', () => {
      hgc.instance().state.views.aa.tracks.top[0].options.colorEncoding = 5;

      hgc.setState(hgc.instance().state);
      hgc.update();

      const svgString = hgc.instance().createSVGString();

      expect(svgString.indexOf('rgba(252,186,144,255)')).to.be.above(1);
    });

    it('Zooms in and ensures that rectangles are rerendered', () => {
      const { trackRenderer } = hgc.instance().tiledPlots.aa;
      const trackObj = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf.views[0].uid,
        viewConf.views[0].tracks.top[0].uid
      );

      const tile = Object.values(trackObj.fetchedTiles)[0];
      const scaleWidth =
        tile.drawnAtScale.domain()[1] - tile.drawnAtScale.domain()[0];

      trackRenderer.zoomToDataPos(
        1585600000,
        1585800000,
        1585600000,
        1585800000,
        0
      );

      const newScaleWidth =
        tile.drawnAtScale.domain()[1] - tile.drawnAtScale.domain()[0];

      expect(newScaleWidth).to.be.below(scaleWidth);
    });

    afterAll(() => {
      removeHGComponent(div);
    });
  });

  afterAll(async () => {
    await fetchMockHelper.storeDataAndResetFetchMock();
  });
});
