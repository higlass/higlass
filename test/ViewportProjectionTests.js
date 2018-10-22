/* eslint-env node, mocha */
import {
  configure,
  // render,
} from 'enzyme';

import {
  select
} from 'd3-selection';

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

  describe('Viewport projection tests', () => {
    beforeAll((done) => {
      ([div, hgc] = mountHGComponent(div, hgc, 'http://higlass.io/api/v1/viewconfs/?d=Y7FtjugjR6OIV_P2DRqCSg',
        done));
    });

    it("Ensure that the viewport projection's borders are black", (done) => {
      // the idea is to make sure the borders of the viewport projection are black
      const viewportRect = select(hgc.instance().topDiv).select('rect.selection');

      // console.log('viewportRect', viewportRect);
      // console.log('componentDiv', viewportRect.style('color'), viewportRect.style('fill'));

      expect(viewportRect.style('color')).to.eql('rgb(51, 51, 51)');
      expect(viewportRect.style('fill')).to.eql('rgb(0, 0, 0)');

      done();
    });

    afterAll((done) => {
      document.body.removeChild(div);

      done();
    });
  });
});
