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

import viewconf from './view-configs/chromsizes';

configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let hgc = null;
  let div = null;
  const fetchMockHelper = new FetchMockHelper(viewconf, 'ChromSizesTests');

  describe('Chromosome Grid Tests', () => {
    beforeAll(async done => {
      await fetchMockHelper.activateFetchMock();
      [div, hgc] = mountHGComponent(div, hgc, viewconf, done, {
        style: 'width:800px; height:800px; background-color: lightgreen',
        bounded: true
      });
    });

    it("Ensure that the viewport projection's borders are grey", () => {
      const trackObject = getTrackObjectFromHGC(
        hgc.instance(),
        'Mw2aWH9TTcu38t5OZlCYyA'
      );

      expect(trackObject.options.lineStrokeColor).to.eql('grey');
    });

    afterAll(async () => {
      await fetchMockHelper.storeDataAndResetFetchMock();
      removeHGComponent(div);
    });
  });
});
