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

vi.describe('HiGlass component creation tests', () => {
  let hgc = null;
  let div = null;

  vi.describe('API tests', () => {
    vi.beforeAll(async () => {
      [div, hgc] = await mountHGComponentAsync(
        div,
        hgc,
        'http://higlass.io/api/v1/viewconfs/?d=default',
      );
    });

    vi.afterAll(() => {
      removeHGComponent(div);
    });

    vi.it('Ensures that the viewconf state is editable', () => {
      vi.expect(hgc.instance().state.viewConfig.editable).to.eql(true);
    });
  });
});
