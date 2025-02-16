// @ts-nocheck
import * as vi from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
  waitForJsonComplete,
} from '../../app/scripts/test-helpers';

import { chromosomeGridTrack, oneZoomedOutViewConf } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

vi.describe('Add overlay tracks', () => {
  let hgc = null;
  let div = null;

  vi.beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, oneZoomedOutViewConf, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: false,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  vi.afterAll(() => {
    removeHGComponent(div);
  });

  vi.it('Add the grid', async () => {
    hgc.instance().handleTracksAdded('aa', [chromosomeGridTrack], 'center');

    hgc.instance().setState(hgc.instance().state);

    await new Promise((done) => waitForJsonComplete(done));
  });

  vi.it('Should show a grid', async () => {
    const outputJSON = JSON.parse(hgc.instance().getViewsAsString());

    vi.expect(outputJSON.views[0].tracks.center[0].contents).to.exist;

    // should have two tracks
    vi.expect(
      outputJSON.views[0].tracks.center[0].contents.length,
    ).to.be.greaterThan(1);

    await new Promise((done) => waitForJsonComplete(done));
  });
});
