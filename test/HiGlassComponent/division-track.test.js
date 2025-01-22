// @ts-nocheck
import { describe, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
} from '../../app/scripts/test-helpers';

import { divisionViewConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Division track', () => {
  it('clones itself', async () => {
    let div = null;
    let hgc = null;
    [div, hgc] = await mountHGComponentAsync(div, hgc, divisionViewConfig, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    hgc.instance().handleAddView(hgc.instance().state.views.aa);
    removeHGComponent(div);
  });
});
