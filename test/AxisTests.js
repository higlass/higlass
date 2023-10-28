// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import {
  mountHGComponentAsync,
  removeHGComponent,
} from '../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../app/scripts/utils';

import viewconf from './view-configs/axis.json';

Enzyme.configure({ adapter: new Adapter() });

describe('Axis tests', () => {
  let hgc = null;
  let div = null;

  describe('Axis tets', () => {
    before(async () => {
      [div, hgc] = await mountHGComponentAsync(div, hgc, viewconf, {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true,
      });
    });

    it('Checks the axis texts', () => {
      const track1 = getTrackObjectFromHGC(
        hgc.instance(),
        'Cs0jaHTuQXuibqx36Ew1xg',
        'frcXuRouRpa_XSm5awtt3Q',
      );

      const texts = track1.axis.axisTexts.map((x) => x.text);

      // make sure we don't find any scientific notation;
      for (const text of texts) {
        expect(text.indexOf('e')).to.be.below(0);
      }

      hgc
        .instance()
        .handleTrackOptionsChanged(
          'Cs0jaHTuQXuibqx36Ew1xg',
          'frcXuRouRpa_XSm5awtt3Q',
          { axisLabelFormatting: 'scientific' },
        );

      hgc.update();

      const texts1 = track1.axis.axisTexts.map((x) => x.text);

      // make sure we find scientific notation;
      // Note that 'scientific' is not always scientific notation. It rather
      // corresponds to 'automatic'. Numbers with a short string representation
      // might not be converted.
      for (const text of texts1) {
        expect(text.indexOf('e')).to.be.above(0);
      }
    });

    it('Checks the axis margin', () => {
      const track1 = getTrackObjectFromHGC(
        hgc.instance(),
        'Cs0jaHTuQXuibqx36Ew1xg',
        'frcXuRouRpa_XSm5awtt3Q',
      );

      const axisMargin = 10;

      expect(track1.position[0] + track1.dimensions[0] - axisMargin).to.equal(
        track1.axis.pAxis.position.x,
      );
    });

    after(async () => {
      removeHGComponent(div);
    });
  });
});
