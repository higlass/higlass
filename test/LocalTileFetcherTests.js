/* eslint-env node, jasmine */
import {
  configure
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';
import viewconf from './view-configs-more/local-tiles-viewconf';
// Utils
import {
  mountHGComponent,
  removeHGComponent,
  getTrackObjectFromHGC
} from '../app/scripts/utils';

configure({ adapter: new Adapter() });

describe('Local Tile Fetcher', () => {
  let hgc = null;
  let div = null;

  beforeAll(done => {
    [div, hgc] = mountHGComponent(div, hgc, viewconf, done, {
      style: 'width:600px; height:400px; background-color: lightgreen',
      bounded: true
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
      Object.values(trackObj.fetchedTiles).every(tile => tile.svgData)
    ).to.eql(true);

    expect(trackObj.zeroLine.fill.alpha).to.eql(1);
  });

  afterAll(() => {
    removeHGComponent(div);
  });
});
