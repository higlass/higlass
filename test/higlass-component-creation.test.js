// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

// Utils
import {
  mountHGComponentAsync,
  removeHGComponent,
} from '../app/scripts/test-helpers';

import viewconf from './view-configs/default.json';

Enzyme.configure({ adapter: new Adapter() });

describe('HiGlass component creation tests', () => {
  let hgc = null;
  let div = null;

  describe('API tests', () => {
    beforeAll(async () => {
      const response = fetch('http://higlass.io/api/v1/viewconfs/?d=default');
      [div, hgc] = await mountHGComponentAsync(div, hgc, await response.json());
    });

    afterAll(() => {
      removeHGComponent(div);
    });

    it('Ensures that the viewconf state is editable', () => {
      expect(hgc.instance().state.viewConfig.editable).to.eql(true);
    });
  });
});
