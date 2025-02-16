// @ts-nocheck
import * as vi from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../../app/scripts/utils';

import { heatmapTrack, project1D } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

vi.describe('1D viewport projection', () => {
  let hgc = null;
  let div = null;

  vi.beforeAll(async () => {
    const newViewConf = JSON.parse(JSON.stringify(project1D));

    const center1 = JSON.parse(JSON.stringify(heatmapTrack));
    center1.height = 200;
    const center2 = JSON.parse(JSON.stringify(heatmapTrack));
    center2.height = 200;

    newViewConf.views[0].tracks.center = [center1];
    newViewConf.views[1].tracks.center = [center2];

    newViewConf.views[0].layout.h = 10;
    newViewConf.views[1].layout.h = 10;

    [div, hgc] = await mountHGComponentAsync(div, hgc, newViewConf, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: false,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  vi.afterAll(() => {
    removeHGComponent(div);
  });

  vi.it('Should lock the location without throwing an error', async () => {
    hgc.instance().handleLocationLockChosen('aa', 'bb');
    // the viewconf contains a location lock, we need to ignore it
    //
    const track = getTrackObjectFromHGC(hgc.instance(), 'bb', 'line2');
    vi.expect(track.labelText.text.indexOf('hg19')).to.equal(0);

    const overlayElements = document.getElementsByClassName('overlay');

    // there should be two colorbars
    vi.expect(overlayElements.length).to.equal(2);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  vi.it('Should add a vertical viewport projection', async () => {
    hgc.instance().handleViewportProjected('bb', 'aa', 'vline1');
    // move the viewport just a little bit
    const overlayElements = document.getElementsByClassName('overlay');

    // we should have created an overlay element
    vi.expect(overlayElements.length).to.equal(3);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  vi.it(
    'Should project the viewport of view2 onto the gene annotations track',
    async () => {
      hgc.instance().handleViewportProjected('bb', 'aa', 'ga1');
      hgc
        .instance()
        .tiledPlots.aa.trackRenderer.setCenter(
          2540607259.217122,
          2541534691.921077,
          195.2581009864807,
        );
      // move the viewport just a little bit
      await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
    },
  );

  vi.it(
    'Should make sure that the track labels still contain the assembly',
    async () => {
      const track = getTrackObjectFromHGC(hgc.instance(), 'bb', 'line2');
      vi.expect(track.labelText.text.indexOf('hg19')).to.equal(0);
      await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
    },
  );

  vi.it(
    'Add a 2D vertical projection and move the lower track to different location',
    async () => {
      hgc
        .instance()
        .tiledPlots.bb.trackRenderer.setCenter(
          2540607259.217122,
          2541534691.921077,
          87.50166702270508,
        );
      hgc.instance().handleViewportProjected('bb', 'aa', 'heatmap3');

      await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
    },
  );
});
