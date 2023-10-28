// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import { simpleCenterViewConfig } from './view-configs';

// Utils
import { removeHGComponent } from '../app/scripts/test-helpers';

import { viewer } from '../app/scripts/hglib';

Enzyme.configure({ adapter: new Adapter() });

describe('Add and remove viewconf', () => {
  let div = null;
  let api = null;

  describe('API tests', () => {
    before(() => {
      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      api = viewer(div, simpleCenterViewConfig, {});
      api.setViewConfig(simpleCenterViewConfig);

      // p.then(() => {
      //   console.log('done');
      //   done();
      // });

      // ([div, hgc] = mountHGComponent(div, hgc, 'http://higlass.io/api/v1/viewconfs/?d=default', done));
    });

    it('Ensures that setting a new viewconf changes the trackSourceServers', () => {
      const viewConf = JSON.parse(api.exportAsViewConfString());
      viewConf.trackSourceServers = ['http://blah'];

      // const p = api.setViewConfig(viewConf);
      const newApi = viewer(div, viewConf, {});
      const newViewConf = JSON.parse(newApi.exportAsViewConfString());

      expect(newViewConf.trackSourceServers[0]).to.eql('http://blah');
    });

    after(() => {
      removeHGComponent(div);
    });
  });
});
