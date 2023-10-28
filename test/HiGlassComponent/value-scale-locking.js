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

import { twoViewConfig, heatmapTrack } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Value scale locking', () => {
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

  it('locks the scales and recenters the page', (done) => {
    hgc
      .instance()
      .handleValueScaleLocked('aa', 'heatmap1', 'view2', 'heatmap2');
    // const track1 = hgc.instance().tiledPlots.aa.trackRenderer.getTrackObject('heatmap1');
    // const track2 = hgc.instance().tiledPlots.view2.trackRenderer.getTrackObject('heatmap2');

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

  it('exports as JSON and makes sure that the scales are locked', () => {
    const data = hgc.instance().getViewsAsString();

    expect(data.indexOf('valueScaleLocks')).to.be.greaterThanOrEqual(0);
  });

  it('Moves the brush on one view and makes sure it moves on the other', (done) => {
    const heatmap1Track = getTrackObjectFromHGC(
      hgc.instance(),
      'aa',
      'heatmap1',
    );

    // console.log('lvs1', heatmapTrack.limitedValueScale.domain());

    // move the brush down to limit the amount of visible data
    heatmap1Track.gColorscaleBrush.call(
      heatmap1Track.scaleBrush.move,
      [0, 100],
    );

    // console.log('lvs2', heatmapTrack.limitedValueScale.domain());

    const heatmap2Track = getTrackObjectFromHGC(
      hgc.instance(),
      'view2',
      'heatmap2',
    );

    expect(heatmap1Track.options.scaleStartPercent).to.equal(
      heatmap2Track.options.scaleStartPercent,
    );
    expect(heatmap1Track.options.scaleEndPercent).to.equal(
      heatmap2Track.options.scaleEndPercent,
    );

    waitForTilesLoaded(hgc.instance(), done);
  });

  // it('Changes the value scale', done => {
  //   hgc
  //     .instance()
  //     .tiledPlots.aa.trackRenderer.setCenter(
  //       179943234.8692136,
  //       179901760.5768778,
  //       2887.21283197403,
  //       true
  //     );

  //   waitForTilesLoaded(hgc.instance(), done);
  // });

  it('ensures that the new track domains are equal', () => {
    const track1 = getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap1');
    const track2 = getTrackObjectFromHGC(hgc.instance(), 'view2', 'heatmap2');

    const domain1 = track1.valueScale.domain();
    const domain2 = track2.valueScale.domain();

    // const zl1 = track1.calculateZoomLevel();
    // const zl2 = track2.calculateZoomLevel();

    // console.log('zl1:', track1.calculateZoomLevel());
    // console.log('zl2:', track2.calculateZoomLevel());

    // the zoom levels are different because one view is slightly larger
    // than the other
    // expect(zl1).to.equal(zl2);

    expect(domain1[1]).to.equal(domain2[1]);
  });

  it('unlocks the scales', (done) => {
    hgc.instance().handleUnlockValueScale('aa', 'heatmap1');

    // unlock the scales and zoom out
    hgc
      .instance()
      .tiledPlots.aa.trackRenderer.setCenter(
        1799432348.8692136,
        1802017603.5768778,
        2887.21283197403,
      );

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('ensure that new domains are unequal and locks the combined tracks', (done) => {
    const track1 = getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap1');
    const track2 = getTrackObjectFromHGC(hgc.instance(), 'view2', 'heatmap2');

    const domain1 = track1.valueScale.domain();
    const domain2 = track2.valueScale.domain();

    expect(domain1[1]).not.to.equal(domain2[1]);

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Locks line and combined scales', (done) => {
    hgc.instance().handleValueScaleLocked('aa', 'c1', 'view2', 'c2');
    hgc.instance().handleValueScaleLocked('aa', 'line1', 'view2', 'line2');

    // lock the scales of two combined views
    hgc
      .instance()
      .tiledPlots.aa.trackRenderer.setCenter(
        2268041199.8615317,
        2267986087.2543955,
        15.803061962127686,
      );

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('ensures that the new track domains are equal and unlock the combined tracks', (done) => {
    const track1 = getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap1');
    const track2 = getTrackObjectFromHGC(hgc.instance(), 'view2', 'heatmap2');

    const domain1 = track1.valueScale.domain();
    const domain2 = track2.valueScale.domain();

    expect(domain1[1]).to.equal(domain2[1]);

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('zooms out', (done) => {
    hgc
      .instance()
      .tiledPlots.aa.trackRenderer.setCenter(
        2268233532.6257076,
        2268099618.396191,
        1710.4168190956116,
      );

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('ensures that the domain changed', (done) => {
    const track1 = getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap1');
    const track2 = getTrackObjectFromHGC(hgc.instance(), 'view2', 'heatmap2');

    const domain1 = track1.valueScale.domain();
    const domain2 = track2.valueScale.domain();

    expect(domain1[1]).to.be.lessThan(1);
    expect(domain1[1]).to.equal(domain2[1]);

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Unlocks the scales and moves to a different location', (done) => {
    hgc.instance().handleUnlockValueScale('aa', 'c1');

    // unlock the scales and zoom out
    hgc
      .instance()
      .tiledPlots.aa.trackRenderer.setCenter(
        1799432348.8692136,
        1802017603.5768778,
        2887.21283197403,
      );

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('ensures that the new track domains are not equal', () => {
    const track1 = hgc
      .instance()
      .tiledPlots.aa.trackRenderer.getTrackObject('heatmap1');
    const track2 = hgc
      .instance()
      .tiledPlots.view2.trackRenderer.getTrackObject('heatmap2');

    const domain1 = track1.valueScale.domain();
    const domain2 = track2.valueScale.domain();

    expect(domain1[1]).not.to.equal(domain2[1]);

    // hgc.instance().handleUnlockValueScale('aa', 'heatmap1');

    // unlock the scales and zoom out
    // hgc.instance().tiledPlots['aa'].trackRenderer
    // .setCenter(1799432348.8692136, 1802017603.5768778, 2887.21283197403);
  });

  it('Lock view scales ', () => {
    hgc.instance().handleZoomLockChosen('aa', 'view2');
    hgc.instance().handleLocationLockChosen('aa', 'view2');
  });

  it('locks the value scales ', () => {
    // lock the value scales to ensure that removing the track doesn't
    // lead to an error
    hgc.instance().handleValueScaleLocked('aa', 'c1', 'view2', 'heatmap2');
  });

  it('Replaces and displays a new track', () => {
    hgc.instance().handleCloseTrack('view2', 'c2');
    hgc.instance().handleTrackAdded('view2', heatmapTrack, 'center');

    hgc.instance().tiledPlots.view2.render();
    hgc
      .instance()
      .tiledPlots.view2.trackRenderer.setCenter(
        1799508622.8021536,
        1801234331.7949603,
        17952.610495328903,
      );

    hgc
      .instance()
      .tiledPlots.view2.trackRenderer.syncTrackObjects(
        hgc.instance().tiledPlots.view2.positionedTracks(),
      );
  });

  it('Replaces and displays a new track', (done) => {
    // hgc.instance().handleValueScaleLocked('aa', 'c1', 'view2', 'heatmap3');

    const track = getTrackObjectFromHGC(hgc.instance(), 'view2', 'heatmap3');

    // make sure that the newly added track is rendered
    expect(track.pMain.position.x).to.be.greaterThan(404);
    expect(track.pMain.position.x).to.be.lessThan(406);

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Locks the scales again (after waiting for the previous tiles to load)', () => {
    hgc.instance().handleValueScaleLocked('aa', 'c1', 'view2', 'heatmap3');
  });
});
