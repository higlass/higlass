// @ts-nocheck
import * as vi from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

// Utils
import {
  mountHGComponentAsync,
  removeHGComponent,
} from '../app/scripts/test-helpers';
import { getTrackByUid, getTrackObjectFromHGC } from '../app/scripts/utils';

import viewconf from './view-configs/loop-annotations';

Enzyme.configure({ adapter: new Adapter() });

vi.describe('2D Rectangular Domains', () => {
  /** @type {import('enzyme').ReactWrapper} */
  let hgc = null;
  /** @type {HTMLElement | null} */
  let div = null;

  vi.beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, viewconf, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  vi.it('export rectangles in the same color that they are in the view', () => {
    const svgString = hgc.instance().createSVGString();
    vi.expect(svgString.indexOf('cyan')).to.be.above(-1);
  });

  vi.it('mirrors loops', () => {
    const { views } = hgc.instance().state;
    const track = getTrackByUid(views.aa.tracks, 't1');
    const trackObj = getTrackObjectFromHGC(hgc.instance(), 'aa', 't1');

    const xVal1 = trackObj.drawnRects['CVV-O3_TTw-Jda38HzJPtgfalse'];

    track.options.flipDiagonal = 'yes';

    hgc.setState({
      views,
    });

    const xVal2 = trackObj.drawnRects['CVV-O3_TTw-Jda38HzJPtgtrue'];

    vi.expect(xVal1.x).to.not.eql(xVal2.x);
    vi.expect(xVal1.y).to.not.eql(xVal2.y);

    vi.expect(Object.keys(trackObj.drawnRects).length).to.eql(3);

    track.options.flipDiagonal = 'copy';

    hgc.setState({
      views,
    });

    vi.expect(Object.keys(trackObj.drawnRects).length).to.eql(6);
  });

  vi.afterAll(() => {
    removeHGComponent(div);
  });
});
