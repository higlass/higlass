// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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

describe('Track Resizing', () => {
  let hgc = null;
  let div = null;

  beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, oneTrackConfig, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  afterAll(() => {
    removeHGComponent(div);
  });

  it('Resizes one track ', async () => {
    const tp = getTiledPlot(hgc.instance(), 'aa');

    tp.handleResizeTrack('line1', 289, 49);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('Ensures that the track object was resized', async () => {
    const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1');

    expect(track.dimensions[1]).to.equal(49);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
});
