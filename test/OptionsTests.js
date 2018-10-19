/* eslint-env node, mocha */
import {
  configure,
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

import {
  simpleCenterViewConfig,
} from './view-configs';

import {
  viewer
} from '../app/scripts/hglib';

configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let div = null;
  let api = null;

  describe('Options tests', () => {
    beforeAll((done) => {
      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      api = viewer(div, simpleCenterViewConfig, { a: 'x' });

      const p = api.setViewConfig(simpleCenterViewConfig);
      api.setAuthHeader('blah');

      done();

      // p.then(() => {
      //   console.log('done');
      //   done();
      // });

      // ([div, hgc] = mountHGComponent(div, hgc, 'http://higlass.io/api/v1/viewconfs/?d=default', done));
    });

    it('creates a new component with different options and checks'
      + 'whether the global options object of the first object has changed', () => {
      const div1 = global.document.createElement('div');
      global.document.body.appendChild(div);

      const api1 = viewer(div1, simpleCenterViewConfig, { a: 'y' });
      api1.setAuthHeader('wha');
    });

    afterAll((done) => {
      document.body.removeChild(div);

      done();
    });
  });
});
