/* eslint-env node, jasmine, mocha */
import {
  configure
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

import FetchMockHelper from './utils/FetchMockHelper';

import viewConf from './view-configs/default';

// Utils
import { mountHGComponent, removeHGComponent } from '../app/scripts/utils';

configure({ adapter: new Adapter() });

describe('HiGlassComponentCreationTest', () => {
  let hgc = null;
  let div = null;
  const fetchMockHelper = new FetchMockHelper(
    viewConf,
    'HiGlassComponentCreationTest'
  );

  beforeAll(async () => {
    await fetchMockHelper.activateFetchMock();
  });

  describe('API tests', () => {
    beforeAll(done => {
      [div, hgc] = mountHGComponent(div, hgc, viewConf, done);
    });

    it('Ensures that the viewconf state is editable', () => {
      expect(hgc.instance().state.viewConfig.editable).to.eql(true);
    });

    afterAll(() => {
      removeHGComponent(div);
    });
  });

  afterAll(async () => {
    await fetchMockHelper.storeDataAndResetFetchMock();
  });
});
