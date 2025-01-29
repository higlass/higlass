// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/test-helpers';

import { twoViewConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

// import FetchMockHelper from '../utils/FetchMockHelper';

describe('Two linked views', () => {
  let hgc = null;
  let div = null;

  beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(
      div,
      hgc,
      JSON.parse(JSON.stringify(twoViewConfig)),
      {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true,
      },
    );
  });

  afterAll(() => {
    removeHGComponent(div);
  });

  it('zoom to the data extent', async () => {
    // console.log('zooming to extent');
    hgc.instance().api.zoomToDataExtent('aa');
    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('ensures both views zoomed to the data extent', () => {
    expect(hgc.instance().xScales.aa.domain()[0]).to.equal(
      hgc.instance().xScales.view2.domain()[0],
    );

    expect(hgc.instance().xScales.aa.domain()[1]).to.equal(
      hgc.instance().xScales.view2.domain()[1],
    );
  });
});
