/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import { mountHGComponent, removeHGComponent } from '../../app/scripts/utils';

import { twoViewConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

// import FetchMockHelper from '../utils/FetchMockHelper';

describe('Value interval track', () => {
  let hgc = null;
  let div = null;
  // const fetchMockHelper = new FetchMockHelper(null, 'higlass.io');

  before((done) => {
    // await fetchMockHelper.activateFetchMock();
    [div, hgc] = mountHGComponent(div, hgc, twoViewConfig, done, {
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

  it("doesn't export maxWidth or filetype", () => {
    const viewString = hgc.instance().getViewsAsString();

    // expect(viewString.indexOf('1d-value-interval')).toBeGreaterThan(0);
    expect(viewString.indexOf('maxWidth')).to.be.lessThan(0);
    expect(viewString.indexOf('filetype')).to.be.lessThan(0);
    expect(viewString.indexOf('binsPerDimension')).to.be.lessThan(0);
  });
});
