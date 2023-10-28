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
import { getTrackObjectFromHGC } from '../../app/scripts/utils';

import { twoViewConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Color scale limiting', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, twoViewConfig, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
  });

  it('Changes the position of the brush to the top right', () => {
    const { views } = hgc.instance().state;
    views.aa.tracks.center[0].contents[0].options.colorbarPosition = 'topRight';

    hgc.instance().setState({ views });
  });

  it('Moves the brush on one of the views', () => {
    const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap1');

    const domain1 = track.limitedValueScale.domain();

    track.gColorscaleBrush.call(track.scaleBrush.move, [0, 100]);

    const domain2 = track.limitedValueScale.domain();

    // we don't expect the other view to change
    expect(domain1[0]).not.to.equal(domain2[0]);

    // console.log('domain1:', domain1);
    // console.log('domain2:', domain2);
  });

  it('locks the scales and recenters the page', (done) => {
    hgc
      .instance()
      .handleValueScaleLocked('aa', 'heatmap1', 'view2', 'heatmap2');
    getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap1');
    getTrackObjectFromHGC(hgc.instance(), 'view2', 'heatmap2');

    // zoom out a little bit
    hgc
      .instance()
      .tiledPlots.aa.trackRenderer.setCenter(
        1799432348.8692136,
        1802017603.5768778,
        28874.21283197403,
      );

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Moves the brush on one view and makes sure it moves on the other', () => {
    const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap1');

    // console.log('lvs1', heatmapTrack.limitedValueScale.domain());

    // move the brush down to limit the amount of visible data
    track.gColorscaleBrush.call(track.scaleBrush.move, [0, 100]);

    // console.log('lvs2', heatmapTrack.limitedValueScale.domain());

    const heatmap2Track = getTrackObjectFromHGC(
      hgc.instance(),
      'view2',
      'heatmap2',
    );

    expect(track.options.scaleStartPercent).to.equal(
      heatmap2Track.options.scaleStartPercent,
    );
    expect(track.options.scaleEndPercent).to.equal(
      heatmap2Track.options.scaleEndPercent,
    );
  });
});
