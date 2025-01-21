// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

// Utils
import {
  mountHGComponentAsync,
  removeHGComponent,
} from '../app/scripts/test-helpers';

Enzyme.configure({ adapter: new Adapter() });

describe('HiGlass component creation tests', () => {
  let hgc = null;
  let div = null;

  describe('API tests', () => {
    beforeAll(async () => {
      [div, hgc] = await mountHGComponentAsync(
        div,
        hgc,
        'http://higlass.io/api/v1/viewconfs/?d=default',
      );
    });

    afterAll(() => {
      removeHGComponent(div);
    });

    it('Ensures that the viewconf state is editable', () => {
      expect(hgc.instance().state.viewConfig.editable).to.eql(true);
    });
  });
});
