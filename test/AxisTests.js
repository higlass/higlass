/* eslint-env node, jasmine, mocha */
import {
  configure
  // render,
} from 'enzyme';

import { expect } from 'chai';

import Adapter from 'enzyme-adapter-react-16';

import {
  mountHGComponent,
  removeHGComponent,
  getTrackObjectFromHGC
} from '../app/scripts/utils';

import viewconf from './view-configs/axis';

configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let hgc = null;
  let div = null;

  describe('Axis texts', () => {
    beforeAll(done => {
      [div, hgc] = mountHGComponent(div, hgc, viewconf, done, {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true
      });
    });

    it('Checks the axis texts', () => {
      const track1 = getTrackObjectFromHGC(
        hgc.instance(),
        'Cs0jaHTuQXuibqx36Ew1xg',
        'frcXuRouRpa_XSm5awtt3Q'
      );

      const texts = track1.axis.axisTexts.map(x => x.text);

      // make sure we don't find any scientific notation;
      for (const text of texts) {
        expect(text.indexOf('e')).to.be.below(0);
      }

      hgc
        .instance()
        .handleTrackOptionsChanged(
          'Cs0jaHTuQXuibqx36Ew1xg',
          'frcXuRouRpa_XSm5awtt3Q',
          { axisLabelFormatting: 'scientific' }
        );

      hgc.update();

      const texts1 = track1.axis.axisTexts.map(x => x.text);

      // make sure we don't find any scientific notation;
      for (const text of texts1) {
        expect(text.indexOf('e')).to.be.above(0);
      }
    });

    it('Checks the axis margin', () => {
      const track1 = getTrackObjectFromHGC(
        hgc.instance(),
        'Cs0jaHTuQXuibqx36Ew1xg',
        'frcXuRouRpa_XSm5awtt3Q'
      );

      const axisMargin = 10;

      expect(track1.position[0] + track1.dimensions[0] - axisMargin).to.equal(
        track1.axis.pAxis.position.x
      );
    });

    afterAll(() => {
      removeHGComponent(div);
    });
  });
});
