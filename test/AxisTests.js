/* eslint-env node, jasmine, mocha */
import {
  configure,
  // render,
} from 'enzyme';

import { expect } from 'chai';

import Adapter from 'enzyme-adapter-react-16';

import {
  getTrackObjectFromHGC
} from '../app/scripts/utils';

import {
  mountHGComponent,
  removeHGComponent,
} from './utils/test-helpers';

configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let hgc = null;
  let div = null;

  describe('Axis texts', () => {
    beforeAll((done) => {
      ([div, hgc] = mountHGComponent(div, hgc,
        'http://higlass.io/api/v1/viewconfs/?d=R-oOO7ohTgaqByNuD7X4-g',
        done,
        {
          style: 'width:800px; height:400px; background-color: lightgreen',
          bounded: true,
        })
      );
    });

    it('Checks the axis texts', () => {
      const track1 = getTrackObjectFromHGC(hgc.instance(),
        'Cs0jaHTuQXuibqx36Ew1xg', 'frcXuRouRpa_XSm5awtt3Q');

      const texts = track1.axis.axisTexts.map(x => x.text);

      // make sure we don't find any scientific notation;
      for (const text of texts) {
        expect(text.indexOf('e')).to.be.below(0);
      }

      hgc.instance().handleTrackOptionsChanged('Cs0jaHTuQXuibqx36Ew1xg',
        'frcXuRouRpa_XSm5awtt3Q',
        { axisLabelFormatting: 'scientific' });

      hgc.update();

      const texts1 = track1.axis.axisTexts.map(x => x.text);

      // make sure we don't find any scientific notation;
      for (const text of texts1) {
        expect(text.indexOf('e')).to.be.above(0);
      }
    });

    afterAll((done) => {
      removeHGComponent(div);

      done();
    });
  });
});
