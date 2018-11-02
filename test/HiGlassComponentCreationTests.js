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
  removeHGComponent,
} from '../app/scripts/utils';


configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let hgc = null;
  let div = null;

  describe('API tests', () => {
    beforeAll((done) => {
      ([div, hgc] = mountHGComponent(div, hgc, 'http://higlass.io/api/v1/viewconfs/?d=default', done));
    });

    it('Ensures that the viewconf state is editable', (done) => {
      expect(hgc.instance().state.viewConfig.editable).to.eql(true);

      done();
    });

    afterAll((done) => {
      removeHGComponent(div);

      done();
    });
  });
});
