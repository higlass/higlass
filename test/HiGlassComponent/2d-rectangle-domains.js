import { configure } from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import {
  mountHGComponent,
  removeHGComponent,
  waitForTilesLoaded,
  getTrackObjectFromHGC,
  getTrackByUid,
} from '../../app/scripts/utils';

import { rectangleDomains } from '../view-configs';

configure({ adapter: new Adapter() });

// import FetchMockHelper from '../utils/FetchMockHelper';

describe('2D Rectangle Annotations', () => {
  let hgc = null;
  let div = null;
  // const fetchMockHelper = new FetchMockHelper(null, 'higlass.io');

  beforeAll(async (done) => {
    // await fetchMockHelper.activateFetchMock();
    [div, hgc] = mountHGComponent(div, hgc, rectangleDomains, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: false,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  afterAll(async () => {
    removeHGComponent(div);
    // await fetchMockHelper.storeDataAndResetFetchMock();
  });

  it('Check to make sure that the rectangles are initially small', (done) => {
    let track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'rectangles1');

    let hasSmaller = false;
    for (const uid of Object.keys(track.drawnRects)) {
      if (track.drawnRects[uid].width < 5) {
        hasSmaller = true;
        break;
      }
    }

    expect(hasSmaller).toEqual(true);

    const { views } = hgc.instance().state;
    track = getTrackByUid(views.aa.tracks, 'rectangles1');

    track.options.minSquareSize = '8';

    hgc.setState({
      views,
    });

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Make sure that the rectangles are large', (done) => {
    let track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'rectangles1');

    let hasSmaller = false;
    for (const uid of Object.keys(track.drawnRects)) {
      if (track.drawnRects[uid].width < 5) {
        hasSmaller = true;
        break;
      }
    }

    expect(hasSmaller).toEqual(false);

    const { views } = hgc.instance().state;
    track = getTrackByUid(views.aa.tracks, 'rectangles1');

    track.options.minSquareSize = '5';

    hgc.setState({
      views,
    });

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Exports to SVG', () => {
    hgc.instance().createSVG();
  });
});
