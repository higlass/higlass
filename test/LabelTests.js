// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import { expect } from 'chai';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

import {
  mountHGComponent,
  removeHGComponent,
} from '../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../app/scripts/utils';

import viewconf from './view-configs/label-margin.json';
import viewconfSplitHeatmaps from './view-configs/label-split-heatmaps.json';

Enzyme.configure({ adapter: new Adapter() });

describe('Label test', () => {
  describe('Axis texts', () => {
    let hgc = null;
    let div = null;
    before((done) => {
      [div, hgc] = mountHGComponent(div, hgc, viewconf, done, {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true,
      });
    });

    it('Checks the label margin', () => {
      const hg = hgc.instance();
      const track1 = getTrackObjectFromHGC(hg, 'aa', 'bar1');
      const track2 = getTrackObjectFromHGC(hg, 'aa', 'bar2');
      const track3 = getTrackObjectFromHGC(hg, 'aa', 'bar3');
      const track4 = getTrackObjectFromHGC(hg, 'aa', 'bar4');

      // pos: topLeft margin: 10 0 0 10
      expect(track1.labelText.x).to.equal(
        track1.position[0] +
          track1.options.labelLeftMargin +
          track1.labelText.width / 2,
      );
      expect(track1.labelText.y).to.equal(
        track1.position[1] + track1.options.labelTopMargin,
      );

      // pos: topRight margin: 10 10 0 0
      expect(track2.labelText.x).to.equal(
        track2.position[0] +
          track2.dimensions[0] -
          track2.options.labelRightMargin -
          track2.labelText.width / 2,
      );
      expect(track2.labelText.y).to.equal(
        track2.position[1] + track2.options.labelTopMargin,
      );

      // pos: bottomLeft margin: 0 0 10 10
      expect(track3.labelText.x).to.equal(
        track3.position[0] +
          track3.options.labelLeftMargin +
          track3.labelText.width / 2,
      );
      expect(track3.labelText.y).to.equal(
        track3.position[1] +
          track3.dimensions[1] -
          track3.options.labelBottomMargin,
      );

      // pos: bottomRight margin: 0 10 10 0
      expect(track4.labelText.x).to.equal(
        track4.position[0] +
          track4.dimensions[0] -
          track4.options.labelRightMargin -
          track2.labelText.width / 2,
      );
      expect(track4.labelText.y).to.equal(
        track4.position[1] +
          track4.dimensions[1] -
          track4.options.labelBottomMargin,
      );
    });

    after(() => {
      removeHGComponent(div);
    });
  });

  describe('Label text options', () => {
    let hgc = null;
    let div = null;
    before((done) => {
      [div, hgc] = mountHGComponent(div, hgc, viewconf, done, {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true,
      });
    });

    it('Checks for assembly text', () => {
      const hg = hgc.instance();
      const track5 = getTrackObjectFromHGC(hg, 'aa', 'bar5');
      const track6 = getTrackObjectFromHGC(hg, 'aa', 'bar6');

      // eslint-disable-next-line no-unused-expressions
      expect(track5.labelText.text.startsWith('hg19 | ')).to.be.true;
      // eslint-disable-next-line no-unused-expressions
      expect(track6.labelText.text.startsWith('hg19 | ')).to.be.false;
    });

    after(() => {
      removeHGComponent(div);
    });
  });

  describe('Heatmap label tests', () => {
    let hgc = null;
    let div = null;
    before((done) => {
      [div, hgc] = mountHGComponent(div, hgc, viewconfSplitHeatmaps, done, {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true,
      });
    });

    it('Makes sure that hiding the label works', () => {
      hgc.instance().state.views.aa.tracks.center[0].contents[0].options.labelPosition =
        'hidden';
      hgc.setState(hgc.instance().state);

      const trackObj = getTrackObjectFromHGC(hgc.instance(), 'aa', 't1');

      expect(trackObj.labelText.alpha).to.be.eql(0);
    });

    after(() => {
      removeHGComponent(div);
    });
  });
});
