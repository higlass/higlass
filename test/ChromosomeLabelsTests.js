/* eslint-env node, jasmine */
import {
  configure
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

import FetchMockHelper from './utils/FetchMockHelper';

import viewconf from './view-configs/chromosomeLabel';

// Utils
import {
  mountHGComponent,
  removeHGComponent,
  getTrackObjectFromHGC,
  getTrackRenderer
} from '../app/scripts/utils';

configure({ adapter: new Adapter() });

describe('Horizontal chromosome labels', () => {
  const fetchMockHelper = new FetchMockHelper(
    viewconf,
    'ChromosomeLabelsTests'
  );

  beforeAll(async () => {
    await fetchMockHelper.activateFetchMock();
  });

  describe('Horizontal chromosome labels', () => {
    let hgc = null;
    let div = null;

    beforeAll(done => {
      [div, hgc] = mountHGComponent(div, hgc, viewconf, done, {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true
      });
    });

    it('should have two ticks for end positions', () => {
      // add your tests here

      const trackObj = getTrackObjectFromHGC(hgc.instance(), 'v1', 't1');
      const trackRenderer = getTrackRenderer(hgc.instance(), 'v1');

      expect(trackRenderer.trackDefObjects.t1.trackDef.track).to.have.property(
        'position'
      );

      expect(trackObj.tickTexts).not.to.have.property('chr17');
      expect(trackObj.tickTexts.all.length).to.eql(2);
    });

    it('should have more than two ticks for other positions', () => {
      hgc.instance().state.views.v1.tracks.top[0].options.tickPositions =
        'even';
      hgc.setState(hgc.instance().state);
      hgc.update();

      const trackObj = getTrackObjectFromHGC(hgc.instance(), 'v1', 't1');
      expect(trackObj.tickTexts).to.have.property('chr17');
    });

    afterAll(() => {
      removeHGComponent(div);
    });
  });

  afterAll(async () => {
    await fetchMockHelper.storeDataAndResetFetchMock();
  });
});
