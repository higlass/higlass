/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import { mountHGComponentAsync, removeHGComponent } from '../../app/scripts/utils';

import { divergentTrackConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

// import FetchMockHelper from '../utils/FetchMockHelper';

describe('Divergent tracks', () => {
  let hgc = null;
  let div = null;
  // const fetchMockHelper = new FetchMockHelper(null, 'higlass.io');

  before(async () => {
    // await fetchMockHelper.activateFetchMock();
    [div, hgc] = await mountHGComponentAsync(div, hgc, divergentTrackConfig, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
    // await fetchMockHelper.storeDataAndResetFetchMock();
  });

  it('Check that there are green and red rects', async () => {
    const svg = hgc.instance().createSVG();
    expect(
      svg.querySelector("rect[fill='green'][stroke='green'][x^='11.24963759567']")
    ).to.exist;
    expect(
      svg.querySelector("rect[fill='red'][stroke='red'][x^='29.81875448954']")
    ).to.exist;
  });
});
