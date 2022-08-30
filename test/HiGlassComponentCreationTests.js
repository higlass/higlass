/* eslint-env node, mocha */
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { expect } from 'chai';

// Utils
import { mountHGComponent, removeHGComponent } from '../app/scripts/utils';

Enzyme.configure({ adapter: new Adapter() });

describe('HiGlass component creation tests', () => {
  let hgc = null;
  let div = null;

  describe('API tests', () => {
    before((done) => {
      [div, hgc] = mountHGComponent(
        div,
        hgc,
        'http://higlass.io/api/v1/viewconfs/?d=default',
        done,
      );
    });

    it('Ensures that the viewconf state is editable', () => {
      expect(hgc.instance().state.viewConfig.editable).to.eql(true);
    });

    after(() => {
      removeHGComponent(div);
    });
  });
});
