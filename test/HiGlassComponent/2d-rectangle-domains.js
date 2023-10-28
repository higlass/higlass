// @ts-nocheck
/* eslint-env mocha */
import { configure } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import {
  mountHGComponent,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/test-helpers';
import { getTrackObjectFromHGC, getTrackByUid } from '../../app/scripts/utils';

import { rectangleDomains } from '../view-configs';

configure({ adapter: new Adapter() });

describe('2D Rectangle Annotations', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, rectangleDomains, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: false,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
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

    expect(hasSmaller).to.be.true;

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

    expect(hasSmaller).to.be.false;

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
