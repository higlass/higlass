// @ts-nocheck
import * as vi from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/test-helpers';
import { getTiledPlot, getTrackObjectFromHGC } from '../../app/scripts/utils';

import { oneTrackConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

vi.describe('Track Resizing', () => {
  let hgc = null;
  let div = null;

  vi.beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, oneTrackConfig, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  vi.afterAll(() => {
    removeHGComponent(div);
  });

  vi.it('Resizes one track ', async () => {
    const tp = getTiledPlot(hgc.instance(), 'aa');

    tp.handleResizeTrack('line1', 289, 49);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  vi.it('Ensures that the track object was resized', async () => {
    const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1');

    vi.expect(track.dimensions[1]).to.equal(49);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
});
