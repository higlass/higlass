/* eslint-env node, jasmine, mocha */
import {
  configure,
  // render,
} from 'enzyme';

import { expect } from 'chai';

import Adapter from 'enzyme-adapter-react-16';

import {
  mountHGComponent,
  removeHGComponent,
  getTrackObjectFromHGC
} from '../app/scripts/utils';

import viewconf from './view-configs/label-margin';

configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let hgc = null;
  let div = null;

  describe('Axis texts', () => {
    beforeAll((done) => {
      [div, hgc] = mountHGComponent(
        div,
        hgc,
        viewconf,
        done,
        {
          style: 'width:800px; height:400px; background-color: lightgreen',
          bounded: true,
        }
      );
    });

    it('Checks the label margin', () => {
      const hg = hgc.instance();
      const track1 = getTrackObjectFromHGC(hg, 'aa', 'bar1');
      const track2 = getTrackObjectFromHGC(hg, 'aa', 'bar2');
      const track3 = getTrackObjectFromHGC(hg, 'aa', 'bar3');
      const track4 = getTrackObjectFromHGC(hg, 'aa', 'bar4');

      // pos: topLeft margin: 10 0 0 10
      expect(track1.labelText.x).to.equal(
        track1.position[0]
        + track1.options.labelLeftMargin
        + (track1.labelText.width / 2)
      );
      expect(track1.labelText.y)
        .to.equal(track1.position[1] + track1.options.labelTopMargin);

      // pos: topRight margin: 10 10 0 0
      expect(track2.labelText.x).to.equal(
        track2.position[0]
        + track2.dimensions[0]
        - track2.options.labelRightMargin
        - (track2.labelText.width / 2)
      );
      expect(track2.labelText.y)
        .to.equal(track2.position[1] + track2.options.labelTopMargin);

      // pos: bottomLeft margin: 0 0 10 10
      expect(track3.labelText.x).to.equal(
        track3.position[0]
        + track3.options.labelLeftMargin
        + (track3.labelText.width / 2)
      );
      expect(track3.labelText.y).to.equal(
        track3.position[1]
        + track3.dimensions[1]
        - track3.options.labelBottomMargin
      );

      // pos: bottomRight margin: 0 10 10 0
      expect(track4.labelText.x).to.equal(
        track4.position[0]
        + track4.dimensions[0]
        - track4.options.labelRightMargin
        - (track2.labelText.width / 2)
      );
      expect(track4.labelText.y).to.equal(
        track4.position[1]
        + track4.dimensions[1]
        - track4.options.labelBottomMargin
      );
    });

    afterAll((done) => {
      removeHGComponent(div);

      done();
    });
  });
});
