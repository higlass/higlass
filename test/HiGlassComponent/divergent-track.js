import { configure } from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { mountHGComponent, removeHGComponent } from '../../app/scripts/utils';

import { divergentTrackConfig } from '../view-configs';

configure({ adapter: new Adapter() });

// import FetchMockHelper from '../utils/FetchMockHelper';

describe('Divergent tracks', () => {
  let hgc = null;
  let div = null;
  // const fetchMockHelper = new FetchMockHelper(null, 'higlass.io');

  before(async (done) => {
    // await fetchMockHelper.activateFetchMock();
    [div, hgc] = mountHGComponent(div, hgc, divergentTrackConfig, done, {
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

  it('Check that there are green and red rects', (done) => {
    const svg = hgc.instance().createSVG();
    const svgText = new XMLSerializer().serializeToString(svg);

    expect(
      svgText.indexOf('fill="green" stroke="green" x="11.24963759567723"'),
    ).toBeGreaterThan(0);
    expect(
      svgText.indexOf('fill="red" stroke="red" x="29.818754489548308"'),
    ).toBeGreaterThan(0);

    done();
  });
});
