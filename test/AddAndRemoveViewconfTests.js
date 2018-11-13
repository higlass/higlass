/* eslint-env node, jasmine, mocha */
import {
  configure,
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

import {
  simpleCenterViewConfig,
} from './view-configs';

// Utils
import {
  removeHGComponent,
} from '../app/scripts/utils';

import {
  viewer
} from '../app/scripts/hglib';

configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let div = null;
  let api = null;

  describe('API tests', () => {
    beforeAll((done) => {
      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      api = viewer(div, simpleCenterViewConfig, {});
      api.setViewConfig(simpleCenterViewConfig);
      done();

      // p.then(() => {
      //   console.log('done');
      //   done();
      // });

      // ([div, hgc] = mountHGComponent(div, hgc, 'http://higlass.io/api/v1/viewconfs/?d=default', done));
    });

    it('Ensures that setting a new viewconf changes the trackSourceServers', (done) => {
      const viewConf = JSON.parse(api.exportAsViewConfString());
      viewConf.trackSourceServers = ['http://blah'];

      // const p = api.setViewConfig(viewConf);
      const newApi = viewer(div, viewConf, {});
      const newViewConf = JSON.parse(newApi.exportAsViewConfString());

      expect(newViewConf.trackSourceServers[0]).to.eql('http://blah');

      done();
    });

    afterAll((done) => {
      removeHGComponent(div);

      done();
    });
  });
});
