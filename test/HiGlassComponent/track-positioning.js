// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import slugid from 'slugid';

import {
  mountHGComponentAsync,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/test-helpers';
import {
  getTrackByUid,
  totalTrackPixelHeight,
  getTrackObjectFromHGC,
} from '../../app/scripts/utils';

import {
  horizontalDiagonalTrackViewConf,
  verticalHeatmapTrack,
  horizontalHeatmapTrack,
  largeHorizontalHeatmapTrack,
  heatmapTrack,
} from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Track positioning', () => {
  let hgc = null;
  let div = null;

  before(async () => {
    [div, hgc] = await mountHGComponentAsync(
      div,
      hgc,
      horizontalDiagonalTrackViewConf,
      {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: false,
      },
    );
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
  });

  it('should add and resize a vertical heatmp', (done) => {
    hgc.instance().handleTrackAdded('aa', verticalHeatmapTrack, 'left');
    hgc.instance().state.views.aa.tracks.left[0].width = 100;

    hgc.setState(hgc.instance().state);
    hgc.instance().tiledPlots.aa.measureSize();

    const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'vh1');

    expect(track.originalTrack.axis.track.flipText).to.equal(true);

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Should flip the vertical heatmap', () => {
    const { views } = hgc.instance().state;
    const track = getTrackByUid(views.aa.tracks, 'vh1');

    track.options.oneDHeatmapFlipped = 'yes';

    const trackObj = getTrackObjectFromHGC(
      hgc.instance(),
      'aa',
      'vh1',
    ).originalTrack;
    hgc.setState({
      views,
    });

    // make sure the heatmap was flipped
    expect(trackObj.pMain.scale.y).to.be.lessThan(0);
  });

  it('Should remove the vertical heatmap', (done) => {
    hgc.instance().handleCloseTrack('aa', 'vh1');
    hgc.setState(hgc.instance().state);
    hgc.instance().tiledPlots.aa.measureSize();

    // setTimeout(done, shortLoadTime);
    waitForTilesLoaded(hgc.instance(), done);
  });

  it('should add a heatmap', (done) => {
    // height defined in the testViewConf file, just the chromosome names
    // track
    expect(totalTrackPixelHeight(hgc.instance().state.views.aa)).to.equal(57);

    hgc.instance().handleTrackAdded('aa', horizontalHeatmapTrack, 'top');

    hgc.setState(hgc.instance().state);

    // this should show the graphics, but it initially doesn't
    waitForTilesLoaded(hgc.instance(), done);
  });

  it('should change the opacity of the label', () => {
    hgc.instance().state.views.aa.tracks.top[0].options.labelBackgroundOpacity = 0.5;

    hgc.setState(hgc.instance().state);
    const horizontalHeatmap = getTrackObjectFromHGC(
      hgc.instance(),
      'aa',
      'hh1',
    );

    expect(horizontalHeatmap.options.labelBackgroundOpacity).to.equal(0.5);
  });

  it('should have a horizontal heatmap scale', () => {
    const horizontalHeatmap = getTrackObjectFromHGC(
      hgc.instance(),
      'aa',
      'hh1',
    );

    const svg = horizontalHeatmap.exportColorBarSVG();
    const rects = svg.getElementsByClassName('color-rect');
    expect(rects.length).to.be.greaterThan(0);

    // let svgText = new XMLSerializer().serializeToString(svg);
  });

  it('should add a large horizontal heatmap', (done) => {
    // handleTrackAdded automatically sets the height
    const prevHeight = hgc.instance().state.views.aa.layout.h;
    hgc.instance().handleTrackAdded('aa', largeHorizontalHeatmapTrack, 'top');

    hgc.setState(hgc.instance().state);

    // make sure that the view has grown
    expect(hgc.instance().state.views.aa.layout.h).to.be.greaterThan(
      prevHeight,
    );

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('should add a few more horizontal tracks', (done) => {
    const numNewTracks = 5;
    for (let i = 0; i < numNewTracks; i++) {
      const newTrackJson = JSON.parse(
        JSON.stringify(largeHorizontalHeatmapTrack),
      );
      newTrackJson.uid = slugid.nice();
      hgc.setState(hgc.instance().state);

      hgc.instance().handleTrackAdded('aa', newTrackJson, 'top');
    }

    hgc.setState(hgc.instance().state);

    waitForTilesLoaded(hgc.instance(), done);
  });

  // it('updates the view and deletes some tracks', (done) => {
  //   hgc.update();
  //   const trackRendererHeight = hgc.instance().tiledPlots.aa.trackRenderer
  //     .currentProps.height;

  //   const numToDelete = 3;
  //   const toDeleteUids = [];
  //   for (let i = 0; i < numToDelete; i++) {
  //     const trackUid = hgc.instance().state.views.aa.tracks.top[i].uid;
  //     toDeleteUids.push(trackUid);
  //   }

  //   for (const uid of toDeleteUids) {
  //     hgc.instance().handleCloseTrack('aa', uid);
  //   }

  //   hgc.setState(hgc.instance().state);

  //   hgc.instance().tiledPlots.aa.measureSize();

  //   // make sure that the trackRenderer is now smaller than it was before
  //   // we deleted the tracks
  //   const newTrackRendererHeight = hgc.instance().tiledPlots.aa.trackRenderer
  //     .currentProps.height;
  //   expect(newTrackRendererHeight).to.be.lessThan(trackRendererHeight);
  //   waitForTilesLoaded(hgc.instance(), done);
  // });

  it('Adds a center heatmap track', (done) => {
    hgc.instance().handleTrackAdded('aa', heatmapTrack, 'center');

    hgc.setState(hgc.instance().state);
    hgc.instance().tiledPlots.aa.measureSize();

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Checks to make sure the newly added heatmap was large enough and deletes a track', () => {
    const prevTotalHeight = hgc
      .instance()
      .calculateViewDimensions(hgc.instance().state.views.aa).totalHeight;

    const newView = hgc.instance().handleCloseTrack('aa', 'hcl').aa;
    hgc.setState(hgc.instance().state);
    // hgc.instance().tiledPlots['aa'].measureSize();

    // let nextTrackRendererHeight =
    // hgc.instance().tiledPlots['aa'].trackRenderer.currentProps.height;
    const nextTotalHeight = hgc
      .instance()
      .calculateViewDimensions(newView).totalHeight;

    // expect(nextTrackRendererHeight).to.equal(prevTrackRendererHeight - 57);
    expect(nextTotalHeight).to.be.lessThan(prevTotalHeight);

    // setTimeout(done, shortLoadTime);
  });

  it('Should resize the center track', (done) => {
    const view = hgc.instance().state.views.aa;
    view.layout.h += 2;

    hgc.setState(hgc.instance().state);
    hgc.instance().tiledPlots.aa.measureSize();

    // setTimeout(done, shortLoadTime);
    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Should add a bottom track and have the new height', () => {
    // const prevHeight = getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap3').dimensions[1];

    const newTrack = JSON.parse(JSON.stringify(horizontalHeatmapTrack));
    newTrack.uid = 'xyx1';

    hgc.instance().handleTrackAdded('aa', newTrack, 'bottom');
    hgc.setState(hgc.instance().state);
    hgc.instance().tiledPlots.aa.measureSize();
    // skip this test for now

    /*

      // adding a new track should not make the previous one smaller

      const newHeight = hgc.instance().tiledPlots.aa.trackRenderer
      .getTrackObject('heatmap3').dimensions[1]
      console.log('prevHeight:', prevHeight, 'newHeight:', newHeight);
      expect(prevHeight).to.equal(newHeight);

      waitForTilesLoaded(hgc.instance(), done);
      */
  });

  it('Should resize the center', (done) => {
    const view = hgc.instance().state.views.aa;
    view.layout.h += 2;

    hgc.setState(hgc.instance().state);
    hgc.instance().tiledPlots.aa.measureSize();

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Should delete the bottom track and not resize the center', (done) => {
    const prevSize = hgc
      .instance()
      .tiledPlots.aa.trackRenderer.getTrackObject('heatmap3').dimensions[1];

    hgc.instance().handleCloseTrack('aa', 'xyx1');
    hgc.setState(hgc.instance().state);
    hgc.instance().tiledPlots.aa.measureSize();

    const nextSize = hgc
      .instance()
      .tiledPlots.aa.trackRenderer.getTrackObject('heatmap3').dimensions[1];

    // Was commented out: Uncomment and see if it works...
    expect(nextSize).to.equal(prevSize);

    waitForTilesLoaded(hgc.instance(), done);
  });
});
