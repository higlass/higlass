/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import {
  mountHGComponent,
  removeHGComponent,
  getTrackObjectFromHGC,
} from '../../app/scripts/utils';

import { geneAnnotationsOnly } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

// import FetchMockHelper from '../utils/FetchMockHelper';

describe('Track dimension modification test', () => {
  let hgc = null;
  let div = null;
  // const fetchMockHelper = new FetchMockHelper(null, 'higlass.io');

  before((done) => {
    // await fetchMockHelper.activateFetchMock();
    [div, hgc] = mountHGComponent(div, hgc, geneAnnotationsOnly, done, {
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

  it('resizes the track', () => {
    const trackId = 'G0zF1N_5QHmgD4MMduoYFQ';
    const viewId = 'aa';
    const settings = {
      viewId,
      trackId,
      height: 100,
    };
    hgc.instance().trackDimensionsModifiedHandler(settings);

    const track = getTrackObjectFromHGC(hgc.instance(), 'aa', trackId);
    expect(track.dimensions[1]).to.equal(100);
  });
});
