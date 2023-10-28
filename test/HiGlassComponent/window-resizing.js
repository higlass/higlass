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

import { project1D, heatmapTrack } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Window resizing', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    const newViewConf = JSON.parse(JSON.stringify(project1D));

    const center1 = JSON.parse(JSON.stringify(heatmapTrack));
    const center2 = JSON.parse(JSON.stringify(heatmapTrack));

    newViewConf.views[0].tracks.center = [center1];
    newViewConf.views[1].tracks.center = [center2];

    newViewConf.views[0].layout.h = 10;
    newViewConf.views[1].layout.h = 10;

    [div, hgc] = mountHGComponent(div, hgc, newViewConf, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
  });

  it('Sends a resize event to fit the current view into the window', (done) => {
    const resizeEvent = new Event('resize');

    window.dispatchEvent(resizeEvent);

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Resize the view', (done) => {
    div.setAttribute(
      'style',
      'width: 600px; height: 600px; background-color: lightgreen',
    );
    const resizeEvent = new Event('resize');

    window.dispatchEvent(resizeEvent);

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Expect the the chosen rowHeight to be less than 24', (done) => {
    expect(hgc.instance().state.rowHeight).to.be.lessThan(24);

    waitForTilesLoaded(hgc.instance(), done);
  });
});
