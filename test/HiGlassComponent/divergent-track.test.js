// @ts-nocheck
import * as vi from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
} from '../../app/scripts/test-helpers';

import { divergentTrackConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

vi.describe('Divergent tracks', () => {
  let hgc = null;
  let div = null;

  vi.beforeAll(async () => {
    // await fetchMockHelper.activateFetchMock();
    [div, hgc] = await mountHGComponentAsync(div, hgc, divergentTrackConfig, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  vi.afterAll(() => {
    removeHGComponent(div);
  });

  vi.it('Check that there are green and red rects', async () => {
    const svg = hgc.instance().createSVG();
    vi.expect(
      svg.querySelector(
        "rect[fill='green'][stroke='green'][x^='11.24963759567']",
      ),
    ).to.exist;
    vi.expect(
      svg.querySelector("rect[fill='red'][stroke='red'][x^='29.81875448954']"),
    ).to.exist;
  });
});
