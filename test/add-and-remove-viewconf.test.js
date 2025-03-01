// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import { simpleCenterViewConfig } from './view-configs';

// Utils
import { removeHGComponent } from '../app/scripts/test-helpers';

import { viewer } from '../app/scripts/hglib';

Enzyme.configure({ adapter: new Adapter() });

describe('Add and remove viewconf', () => {
  let div = null;
  let api = null;

  describe('API tests', () => {
    beforeAll(async () => {
      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      api = await viewer(div, simpleCenterViewConfig, {});
      api.setViewConfig(simpleCenterViewConfig);
    });

    it('Ensures that setting a new viewconf changes the trackSourceServers', async () => {
      const viewConf = JSON.parse(api.exportAsViewConfString());
      viewConf.trackSourceServers = ['http://blah'];

      // const p = api.setViewConfig(viewConf);
      const newApi = await viewer(div, viewConf, {});
      const newViewConf = JSON.parse(newApi.exportAsViewConfString());

      expect(newViewConf.trackSourceServers[0]).to.eql('http://blah');
    });

    afterAll(() => {
      removeHGComponent(div);
    });
  });
});
