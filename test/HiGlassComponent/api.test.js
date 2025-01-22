// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
} from '../../app/scripts/test-helpers';

import { simpleCenterViewConfig, twoViewConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('View positioning', () => {
  let hgc = null;
  let div = null;

  beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, simpleCenterViewConfig, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });

    // visual check that the heatmap track config menu is moved
    // to the left
  });

  afterAll(async () => {
    removeHGComponent(div);
  });

  it('Sets a new viewconfig', async () => {
    await hgc.instance().api.setViewConfig(twoViewConfig);
  });

  it('Zooms one of the views to the center', () => {
    hgc.instance().api.zoomToDataExtent('view2');
  });

  it('Zooms a nonexistant view to the center', () => {
    const badFn = () => hgc.instance().api.zoomToDataExtent('xxx');

    expect(badFn).to.throw;
  });
});
