// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import {
  mountHGComponent,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/test-helpers';

import { twoViewConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

// import FetchMockHelper from '../utils/FetchMockHelper';

describe('Two linked views', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(
      div,
      hgc,
      JSON.parse(JSON.stringify(twoViewConfig)),
      done,
      {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true,
      },
    );
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
  });

  it('zoom to the data extent', (done) => {
    // console.log('zooming to extent');
    hgc.instance().api.zoomToDataExtent('aa');

    waitForTilesLoaded(hgc.instance(), done);
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
