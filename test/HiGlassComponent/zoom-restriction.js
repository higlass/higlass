import { configure } from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import {
  mountHGComponent,
  removeHGComponent,
  waitForTransitionsFinished,
} from '../../app/scripts/utils';

import { restrictedZoom } from '../view-configs';

configure({ adapter: new Adapter() });

// import FetchMockHelper from '../utils/FetchMockHelper';

describe('Zoom restriction', () => {
  let hgc = null;
  let div = null;
  // const fetchMockHelper = new FetchMockHelper(null, 'higlass.io');

  beforeAll(async (done) => {
    // await fetchMockHelper.activateFetchMock();
    [div, hgc] = mountHGComponent(div, hgc, restrictedZoom, done, {
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

  it('Has the corrent limits', (done) => {
    const zoomLimits = hgc.instance().tiledPlots.aa.props.zoomLimits;
    expect(zoomLimits[0]).toEqual(0.002);
    expect(zoomLimits[1]).toEqual(2);
    done();
  });

  it('Zooms in and respects zoom limit', (done) => {
    // Create a wheel event that zooms in beying the zoom limit
    const evt = new WheelEvent('wheel', {
      deltaX: 0,
      deltaY: -500,
      deltaZ: 0,
      deltaMode: 0,
      clientX: 262,
      clientY: 572,
      screenX: 284,
      screenY: 696,
      view: window,
      bubbles: true,
      cancelable: true,
    });

    hgc.instance().tiledPlots.aa.trackRenderer.element.dispatchEvent(evt);

    waitForTransitionsFinished(hgc.instance(), () => {
      // Make sure, it does not zoom too far
      const k = hgc.instance().tiledPlots.aa.trackRenderer.zoomTransform.k;
      expect(k).toEqual(2);

      done();
    });
  });
});
