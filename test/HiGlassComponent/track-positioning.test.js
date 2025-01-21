// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import slugid from 'slugid';

import {
  mountHGComponentAsync,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/test-helpers';
import {
  getTrackByUid,
  getTrackObjectFromHGC,
  totalTrackPixelHeight,
} from '../../app/scripts/utils';

import {
  heatmapTrack,
  horizontalDiagonalTrackViewConf,
  horizontalHeatmapTrack,
  largeHorizontalHeatmapTrack,
  verticalHeatmapTrack,
} from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Track positioning', () => {
  let hgc = null;
  let div = null;

  beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(
      div,
      hgc,
      horizontalDiagonalTrackViewConf,
      {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: false,
      },
    );
  });

  afterAll(() => {
    removeHGComponent(div);
  });

  it('should add and resize a vertical heatmp', async () => {
    hgc.instance().handleTrackAdded('aa', verticalHeatmapTrack, 'left');
    hgc.instance().state.views.aa.tracks.left[0].width = 100;

    hgc.setState(hgc.instance().state);
    hgc.instance().tiledPlots.aa.measureSize();

    const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'vh1');

    expect(track.originalTrack.axis.track.flipText).to.equal(true);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
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

  it('Should remove the vertical heatmap', async () => {
    hgc.instance().handleCloseTrack('aa', 'vh1');
    hgc.setState(hgc.instance().state);
    hgc.instance().tiledPlots.aa.measureSize();

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('should add a heatmap', async () => {
    // height defined in the testViewConf file, just the chromosome names
    // track
    expect(totalTrackPixelHeight(hgc.instance().state.views.aa)).to.equal(57);

    hgc.instance().handleTrackAdded('aa', horizontalHeatmapTrack, 'top');

    hgc.setState(hgc.instance().state);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
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

  it('should add a large horizontal heatmap', async () => {
    // handleTrackAdded automatically sets the height
    const prevHeight = hgc.instance().state.views.aa.layout.h;
    hgc.instance().handleTrackAdded('aa', largeHorizontalHeatmapTrack, 'top');

    hgc.setState(hgc.instance().state);

    // make sure that the view has grown
    expect(hgc.instance().state.views.aa.layout.h).to.be.greaterThan(
      prevHeight,
    );

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('should add a few more horizontal tracks', async () => {
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

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('Adds a center heatmap track', async () => {
    hgc.instance().handleTrackAdded('aa', heatmapTrack, 'center');

    hgc.setState(hgc.instance().state);
    hgc.instance().tiledPlots.aa.measureSize();

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
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

  it('Should resize the center track', async () => {
    const view = hgc.instance().state.views.aa;
    view.layout.h += 2;

    hgc.setState(hgc.instance().state);
    hgc.instance().tiledPlots.aa.measureSize();

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('Should add a bottom track and have the new height', () => {
    // const prevHeight = getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap3').dimensions[1];

    const newTrack = JSON.parse(JSON.stringify(horizontalHeatmapTrack));
    newTrack.uid = 'xyx1';

    hgc.instance().handleTrackAdded('aa', newTrack, 'bottom');
    hgc.setState(hgc.instance().state);
    hgc.instance().tiledPlots.aa.measureSize();
  });

  it('Should resize the center', async () => {
    const view = hgc.instance().state.views.aa;
    view.layout.h += 2;

    hgc.setState(hgc.instance().state);
    hgc.instance().tiledPlots.aa.measureSize();

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('Should delete the bottom track and not resize the center', async () => {
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

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
});
