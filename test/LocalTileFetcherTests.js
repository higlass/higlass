// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import viewconf from './view-configs-more/local-tiles-viewconf.json';
// Utils
import {
  mountHGComponent,
  removeHGComponent,
} from '../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../app/scripts/utils';

Enzyme.configure({ adapter: new Adapter() });

describe('Local Tile Fetcher', () => {
  let hgc = null;

  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, viewconf, done, {
      style: 'width:600px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  it('should get the gene annotation track', () => {
    const trackObj = getTrackObjectFromHGC(hgc.instance(), 'vv', 'tt');

    expect(trackObj.allTexts.length).to.be.above(0);
    expect(trackObj.allTexts[0].caption).to.eql('SEMA3A');
  });

  it('should get the bar track', () => {
    const trackObj = getTrackObjectFromHGC(hgc.instance(), 'vv', 'ss');

    expect(
      Object.values(trackObj.fetchedTiles).every((tile) => tile.svgData),
    ).to.eql(true);

    expect(trackObj.zeroLine.fill.alpha).to.eql(1);
  });

  after(() => {
    removeHGComponent(div);
  });
});
