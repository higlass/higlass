import { configure } from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { mountHGComponent, removeHGComponent } from '../../app/scripts/utils';

import { twoViewConfig } from '../view-configs';

configure({ adapter: new Adapter() });

// import FetchMockHelper from '../utils/FetchMockHelper';

describe('Value interval track', () => {
  let hgc = null;
  let div = null;
  // const fetchMockHelper = new FetchMockHelper(null, 'higlass.io');

  beforeAll(async (done) => {
    // await fetchMockHelper.activateFetchMock();
    [div, hgc] = mountHGComponent(div, hgc, twoViewConfig, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  afterAll(async () => {
    removeHGComponent(div);
    // await fetchMockHelper.storeDataAndResetFetchMock();
  });

  it("doesn't export maxWidth or filetype", () => {
    const viewString = hgc.instance().getViewsAsString();

    // expect(viewString.indexOf('1d-value-interval')).toBeGreaterThan(0);
    expect(viewString.indexOf('maxWidth')).toBeLessThan(0);
    expect(viewString.indexOf('filetype')).toBeLessThan(0);
    expect(viewString.indexOf('binsPerDimension')).toBeLessThan(0);
  });
});
