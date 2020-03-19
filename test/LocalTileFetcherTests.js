/* eslint-env node, jasmine */
import {
  configure
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';
import FetchMockHelper from './utils/FetchMockHelper';

import viewconf from './view-configs-more/local-tiles-viewconf';
// Utils
import {
  mountHGComponent,
  removeHGComponent,
  getTrackObjectFromHGC
} from '../app/scripts/utils';

configure({ adapter: new Adapter() });

describe('Local Tile Fetcher Tests', () => {
  const fetchMockHelper = new FetchMockHelper(
    viewconf,
    'LocalTileFetcherTests'
  );

  beforeAll(async () => {
    await fetchMockHelper.activateFetchMock();
  });

  describe('Local Tile Fetcher Tests', () => {
    let hgc = null;
    let div = null;

    beforeAll(done => {
      [div, hgc] = mountHGComponent(div, hgc, viewconf, done, {
        style: 'width:600px; height:400px; background-color: lightgreen',
        bounded: true
      });
    });

    it('should respect zoom limits', () => {
      const trackObj = getTrackObjectFromHGC(hgc.instance(), 'vv', 'tt');

      expect(trackObj.allTexts.length).to.be.above(0);
      expect(trackObj.allTexts[0].caption).to.eql('SEMA3A');
    });

    afterAll(() => {
      removeHGComponent(div);
    });
  });

  afterAll(async () => {
    await fetchMockHelper.storeDataAndResetFetchMock();
  });
});
