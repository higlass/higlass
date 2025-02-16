// @ts-nocheck
import * as vi from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

// Utils
import {
  mountHGComponentAsync,
  removeHGComponent,
} from '../app/scripts/test-helpers';

Enzyme.configure({ adapter: new Adapter() });

// TODO: Trevor(2025-01-21) - all these tests just assert true?

vi.describe('Minimal viewconfs', () => {
  vi.describe('Crazy minimal', () => {
    const viewconf = {};
    let hgc = null;
    let div = null;
    vi.beforeAll(async () => {
      [div, hgc] = await mountHGComponentAsync(div, hgc, viewconf);
    });
    vi.afterAll(() => {
      removeHGComponent(div);
    });
    vi.it('can load and unload', () => {
      vi.expect(true).to.equal(true);
    });
  });
  vi.describe('Reasonably minimal', () => {
    const viewconf = {
      views: [
        {
          tracks: {
            top: [],
            left: [],
            center: [],
            right: [],
            bottom: [],
            whole: [],
            gallery: [],
          },
        },
      ],
    };
    let hgc = null;
    let div = null;
    vi.beforeAll(async () => {
      [div, hgc] = await mountHGComponentAsync(div, hgc, viewconf);
    });
    vi.afterAll(() => {
      removeHGComponent(div);
    });
    vi.it('can load and unload', () => {
      vi.expect(true).to.equal(true);
    });
  });
  vi.describe('Minimal with CrossRule', () => {
    const viewconf = {
      views: [
        {
          initialXDomain: [0, 200],
          initialYDomain: [0, 200],
          tracks: {
            whole: [
              {
                type: 'cross-rule',
                x: 100,
                y: 100,
              },
            ],
          },
        },
      ],
    };
    let hgc = null;
    let div = null;
    vi.beforeAll(async () => {
      [div, hgc] = await mountHGComponentAsync(div, hgc, viewconf);
    });
    vi.afterAll(() => {
      removeHGComponent(div);
    });
    vi.it('can load and unload', async () => {
      vi.expect(true).to.equal(true);
    });
  });
});
