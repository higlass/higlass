// @ts-nocheck
import * as vi from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/test-helpers';
import { getTrackByUid, getTrackObjectFromHGC } from '../../app/scripts/utils';

import { rectangleDomains } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

vi.describe('2D Rectangle Annotations', () => {
  let hgc = null;
  let div = null;

  vi.beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, rectangleDomains, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: false,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  vi.afterAll(() => {
    removeHGComponent(div);
  });

  vi.it(
    'Check to make sure that the rectangles are initially small',
    async () => {
      let track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'rectangles1');

      let hasSmaller = false;
      for (const uid of Object.keys(track.drawnRects)) {
        if (track.drawnRects[uid].width < 5) {
          hasSmaller = true;
          break;
        }
      }

      vi.expect(hasSmaller).to.be.true;

      const { views } = hgc.instance().state;
      track = getTrackByUid(views.aa.tracks, 'rectangles1');

      track.options.minSquareSize = '8';

      hgc.setState({ views });

      await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
    },
  );

  vi.it('Make sure that the rectangles are large', async () => {
    let track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'rectangles1');

    let hasSmaller = false;
    for (const uid of Object.keys(track.drawnRects)) {
      if (track.drawnRects[uid].width < 5) {
        hasSmaller = true;
        break;
      }
    }

    vi.expect(hasSmaller).to.be.false;

    const { views } = hgc.instance().state;
    track = getTrackByUid(views.aa.tracks, 'rectangles1');

    track.options.minSquareSize = '5';

    hgc.setState({ views });
    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  vi.it('Exports to SVG', () => {
    hgc.instance().createSVG();
  });
});
