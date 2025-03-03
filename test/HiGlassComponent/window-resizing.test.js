// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/test-helpers';

import { heatmapTrack, project1D } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Window resizing', () => {
  let hgc = null;
  let div = null;

  beforeAll(async () => {
    const newViewConf = JSON.parse(JSON.stringify(project1D));

    const center1 = JSON.parse(JSON.stringify(heatmapTrack));
    const center2 = JSON.parse(JSON.stringify(heatmapTrack));

    newViewConf.views[0].tracks.center = [center1];
    newViewConf.views[1].tracks.center = [center2];

    newViewConf.views[0].layout.h = 10;
    newViewConf.views[1].layout.h = 10;

    [div, hgc] = await mountHGComponentAsync(div, hgc, newViewConf, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  afterAll(() => {
    removeHGComponent(div);
  });

  it('Sends a resize event to fit the current view into the window', async () => {
    const resizeEvent = new Event('resize');

    window.dispatchEvent(resizeEvent);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('Resize the view', async () => {
    div.setAttribute(
      'style',
      'width: 600px; height: 600px; background-color: lightgreen',
    );
    const resizeEvent = new Event('resize');

    window.dispatchEvent(resizeEvent);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('Expect the the chosen rowHeight to be less than 24', async () => {
    expect(hgc.instance().state.rowHeight).to.be.lessThan(24);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
});
