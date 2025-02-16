// @ts-nocheck
import * as vi from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
} from '../../app/scripts/test-helpers';

import { twoViewConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

vi.describe('Value interval track', () => {
  let hgc = null;
  let div = null;

  vi.beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, twoViewConfig, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  vi.afterAll(() => {
    removeHGComponent(div);
  });

  vi.it("doesn't export maxWidth or filetype", () => {
    const viewString = hgc.instance().getViewsAsString();

    // expect(viewString.indexOf('1d-value-interval')).toBeGreaterThan(0);
    vi.expect(viewString.indexOf('maxWidth')).to.be.lessThan(0);
    vi.expect(viewString.indexOf('filetype')).to.be.lessThan(0);
    vi.expect(viewString.indexOf('binsPerDimension')).to.be.lessThan(0);
  });
});
