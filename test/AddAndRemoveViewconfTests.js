/* eslint-env node, mocha */
import {
  configure,
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

// Utils
import {
  mountHGComponent,
} from '../app/scripts/utils';


configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let hgc = null;
  let div = null;

  describe('API tests', () => {
    beforeAll((done) => {
      const div = global.document.createElement('div');
      global.document.body.appendChild(div);

      ([div, hgc] = mountHGComponent(div, hgc, 'http://higlass.io/api/v1/viewconfs/?d=default', done));
    });

    it('Ensures that the viewconf state is editable', (done) => {
      const viewConf = JSON.parse(hgc.instance().getViewsAsString());

      console.log('viewConf:', viewConf);
      viewConf.trackSourceServers  = ['http://blah'];

      const p = hgc.instance().api.setViewConfig(viewConf);

      p.then(() => {
        const newViewConf = JSON.parse(hgc.instance().getViewsAsString());
        console.log('newViewConf', newViewConf);
        done();
      });
    });

    afterAll((done) => {
      document.body.removeChild(div);

      done();
    });
  });
});
