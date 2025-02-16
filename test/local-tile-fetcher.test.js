// @ts-nocheck
import * as vi from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

// Utils
import {
  mountHGComponentAsync,
  removeHGComponent,
} from '../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../app/scripts/utils';
import viewconf from './view-configs-more/local-tiles-viewconf.json';

Enzyme.configure({ adapter: new Adapter() });

vi.describe('Local Tile Fetcher', () => {
  let hgc = null;
  let div = null;

  vi.beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, viewconf, {
      style: 'width:600px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  vi.afterAll(() => {
    removeHGComponent(div);
  });

  vi.it('should get the gene annotation track', () => {
    const trackObj = getTrackObjectFromHGC(hgc.instance(), 'vv', 'tt');

    vi.expect(trackObj.allTexts.length).to.be.above(0);
    vi.expect(trackObj.allTexts[0].caption).to.eql('SEMA3A');
  });

  vi.it('should get the bar track', () => {
    const trackObj = getTrackObjectFromHGC(hgc.instance(), 'vv', 'ss');

    vi.expect(
      Object.values(trackObj.fetchedTiles).every((tile) => tile.svgData),
    ).to.eql(true);

    vi.expect(trackObj.zeroLine.fill.alpha).to.eql(1);
  });
});
