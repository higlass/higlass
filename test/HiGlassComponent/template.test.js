// @ts-nocheck
import { afterAll, beforeAll, describe, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
} from '../../app/scripts/test-helpers';

import { divisionViewConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Division track', () => {
  let hgc = null;
  let div = null;

  beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, divisionViewConfig, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  afterAll(() => {
    removeHGComponent(div);
  });

  it('no-op', () => {});
});
