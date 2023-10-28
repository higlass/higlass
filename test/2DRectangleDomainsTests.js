// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

// Utils
import {
  mountHGComponent,
  removeHGComponent,
} from '../app/scripts/test-helpers';
import { getTrackByUid, getTrackObjectFromHGC } from '../app/scripts/utils';

import viewconf from './view-configs/loop-annotations';

Enzyme.configure({ adapter: new Adapter() });

describe('2D Rectangular Domains', () => {
  /** @type {import('enzyme').ReactWrapper} */
  let hgc = null;
  /** @type {HTMLElement | null} */
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, viewconf, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  it('export rectangles in the same color that they are in the view', () => {
    const svgString = hgc.instance().createSVGString();
    expect(svgString.indexOf('cyan')).to.be.above(-1);
  });

  it('mirrors loops', () => {
    const { views } = hgc.instance().state;
    const track = getTrackByUid(views.aa.tracks, 't1');
    const trackObj = getTrackObjectFromHGC(hgc.instance(), 'aa', 't1');

    const xVal1 = trackObj.drawnRects['CVV-O3_TTw-Jda38HzJPtgfalse'];

    track.options.flipDiagonal = 'yes';

    hgc.setState({
      views,
    });

    const xVal2 = trackObj.drawnRects['CVV-O3_TTw-Jda38HzJPtgtrue'];

    expect(xVal1.x).to.not.eql(xVal2.x);
    expect(xVal1.y).to.not.eql(xVal2.y);

    expect(Object.keys(trackObj.drawnRects).length).to.eql(3);

    track.options.flipDiagonal = 'copy';

    hgc.setState({
      views,
    });

    expect(Object.keys(trackObj.drawnRects).length).to.eql(6);
  });

  after(() => {
    removeHGComponent(div);
  });
});
