/* eslint-env node, mocha */
import {
  mount,
  // render,
  ReactWrapper,
} from 'enzyme';
import { expect } from 'chai';
import { select } from 'd3-selection';
import React from 'react';
import ReactDOM from 'react-dom';
import slugid from 'slugid';

import HiGlassComponent from '../app/scripts/HiGlassComponent';
import {tileProxy,requestsInFlight} from '../app/scripts/services';
import HeatmapOptions from '../app/scripts/HeatmapOptions';

// Utils
import {
  scalesCenterAndK,
  dictValues,
  totalTrackPixelHeight,
  getTrackByUid,
} from '../app/scripts/utils';

// Configs
import {
  ZOOM_TRANSITION_DURATION,
} from '../app/scripts/configs';

// View configs
import {
  // paperFigure1,
  invalidTrackConfig,
  divergentTrackConfig,
  divisionViewConfig,
  simpleCenterViewConfig,
  rectangleDomains,
  threeViews,
  fritzBug1,
  fritzBug2,
  project1D,
  noGPSB,
  onlyGPSB,
  chromInfoTrack,
  heatmapTrack,
  twoViewConfig,
  oneViewConfig,
  oneTrackConfig,
  oneZoomedOutViewConf,
  // valueIntervalTrackViewConf,
  horizontalDiagonalTrackViewConf,
  horizontalHeatmapTrack,
  largeHorizontalHeatmapTrack,
  verticalHeatmapTrack,
  chromosomeGridTrack,
  testViewConfX1,
  testViewConfX2,
} from './view-configs';

const pageLoadTime = 1200;
const tileLoadTime = 1800;
const shortLoadTime = 200; // for rapid changes,
// just to make sure the screen can display what's happened

function testAsync(done) {
  // Wait two seconds, then set the flag to true
  setTimeout(() => {
    // flag = true;

    // Invoke the special done callback
    done();
  }, pageLoadTime);
}

function getTrackObject(hgc, viewUid, trackUid) {
  return hgc.instance().tiledPlots[viewUid].trackRenderer.getTrackObject(trackUid);
}

function getTrackRenderer(hgc, viewUid, trackUid) {
    return hgc.instance().tiledPlots[viewUid].trackRenderer
}

function getTiledPlot(hgc, viewUid) {
  return hgc.instance().tiledPlots[viewUid];
}

function areTransitionsActive(hgc) {
  /**
   * Check if there are any active transitions that we
   * need to wait on
   * 
   * Parameters
   * ----------
     *  hgc: enzyme wrapper for a HiGlassComponent
     *
     * Returns
     * -------
     *  True if any of the tracks have active transtions. False otherwise.
     */
    for (let track of hgc.instance().iterateOverTracks()) {
      let trackRenderer = getTrackRenderer(hgc, track.viewId, track.trackId);

      if (trackRenderer.activeTransitions > 0)
        return true;
    }
  return false;
}

/**
 * Check if a HiGlassComponent is still waiting on tiles from a remote
 * server.
 *
 * Arguments
 * ---------
 *  hgc: enzyme wrapper for a HiGlassComponent
 *
 * Returns
 * -------
 *  True if any of the tracks are waiting for tiles, false otherwise.
 */
function isWaitingOnTiles(hgc) {
  for (const track of hgc.instance().iterateOverTracks()) {
    let trackObj = getTrackObject(hgc, track.viewId, track.trackId);

    if (track.track.type == 'viewport-projection-vertical' || 
        track.track.type == 'viewport-projection-horizontal' ||
        track.track.type == 'viewport-projection-center')
      continue;

    if (trackObj.originalTrack) { trackObj = trackObj.originalTrack; }

    if (!trackObj) {
      console.warn('no track obj', getTrackObject(hgc, track.viewId, track.trackId));
    }

    if (!(trackObj.tilesetInfo || trackObj.chromInfo)) {
      console.warn('no tileset info');
      return true;
    }

    // if (trackObj.fetching)
    //   console.log('trackObj.fetching.size:', trackObj.fetching);

    if (trackObj.fetching && trackObj.fetching.size) {
      return true;
    }
  }

  return false;
}

function waitForTilesLoaded(hgc, tilesLoadedCallback) {
  /**
     * Wait until all of the tiles in the HiGlassComponent are loaded
     * until calling the callback
     *
     * Arguments
     * ---------
     *  hgc: Enzyme wrapper for a HiGlassComponent
     *      The componentthat we're waiting on
     *  tilesLoadedCallback: function
     *      The callback to call whenever all of the tiles
     *      have been loaded.
     * Returns
     * -------
     *  Nothing
     */
  const TILE_LOADING_CHECK_INTERVAL = 100;
  // console.log('jasmine.DEFAULT_TIMEOUT_INTERVAL', jasmine.DEFAULT_TIMEOUT_INTERVAL);

  if (isWaitingOnTiles(hgc)) {
    setTimeout(() => {
      waitForTilesLoaded(hgc, tilesLoadedCallback);
    }, TILE_LOADING_CHECK_INTERVAL);
  } else {
    // console.log('finished');
    tilesLoadedCallback();
  }
}

const TILE_LOADING_CHECK_INTERVAL = 100;

function waitForJsonComplete(finished) {
  /*
   * Wait until all open JSON requests are finished
   *
   * Parameters
   * ----------
   *  finished: function
   *    A callback to call when there's no more JSON requests
   *    open
   *
   */
  if (requestsInFlight > 0) {
    setTimeout(() => waitForJsonComplete(finished),
      TILE_LOADING_CHECK_INTERVAL);
  } else {
    finished();
  }
}

function waitForTransitionsFinished(hgc, callback) {
    /**
     * Wait until all transitions have finished before
     * calling the callback
     *
     * Arguments
     * ---------
     *  hgc: Enzyme wrapper for a HiGlassComponent
     *      The componentthat we're waiting on
     *  tilesLoadedCallback: function
     *      The callback to call whenever all of the tiles
     *      have been loaded.
     * Returns
     * -------
     *  Nothing
     */
    //console.log('jasmine.DEFAULT_TIMEOUT_INTERVAL', jasmine.DEFAULT_TIMEOUT_INTERVAL);

    if (areTransitionsActive(hgc)) {
        setTimeout(() => { 
            waitForTransitionsFinished(hgc, callback);
        }, TILE_LOADING_CHECK_INTERVAL);
    } else {
        //console.log('finished');
        callback();
    }
}

describe('Simple HiGlassComponent', () => {
  let hgc = null,
    div = null,
    atm = null;

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 2000;

  describe('Invalid track type tests', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent
        options={{ bounded: false }}
        viewConfig={invalidTrackConfig}
      />, { attachTo: div });

      hgc.update();
      waitForTilesLoaded(hgc, done);

      // visual check that the heatmap track config menu is moved
      // to the left
    });

    it ("Opens the track type menu", (done) => {
      const clickPosition = {
        bottom : 85,
        height : 28,
        left : 246,
        right : 274,
        top : 57,
        width : 28,
        x : 246,
        y : 57,
      }
      const uid = 'line1';

      hgc.instance().tiledPlots.aa.handleConfigTrackMenuOpened(uid, clickPosition);
      let cftm = hgc.instance().tiledPlots.aa.configTrackMenu;

      const subMenuRect = {
        bottom : 88,
        height : 27,
        left : 250,
        right : 547.984375,
        top : 61,
        width : 297.984375,
        x : 250,
        y : 61,
      }

      const series = invalidTrackConfig.views[0].tracks.top;

      // get the object corresponding to the series
      cftm.handleItemMouseEnterWithRect(subMenuRect, series);
      let seriesObj = cftm.seriesListMenu;

      const position = {left: 127.03125, top: 84};
      const bbox = {
        bottom : 104,
        height : 20,
        left : 131.03125,
        right : 246,
        top : 84,
        width : 114.96875,
        x : 131.03125,
        y : 84,
      };

      let trackTypeItems = seriesObj.getTrackTypeItems(position, bbox, series);

      expect(trackTypeItems.props.menuItems).to.not.have.property('horizontal-line');
      expect(trackTypeItems.props.menuItems).to.not.have.property('horizontal-point');

      let configMenuItems = seriesObj.getConfigureSeriesMenu(position, bbox, series);

      done();
    });

    it('Opens the close track menu', (done) => {
      const clickPosition = {
        bottom : 85,
        height : 28,
        left : 246,
        right : 274,
        top : 57,
        width : 28,
        x : 246,
        y : 57,
      }
      const uid = 'line1';

      hgc.instance().tiledPlots.aa.handleCloseTrackMenuOpened(uid, clickPosition);

      done();
    });
  });
  return;

  describe('Colormap tests', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'height:800px; width:800px');
      div.setAttribute('id', 'single-view');
      hgc = mount(<HiGlassComponent
        options={{ bounded: true }}
        viewConfig={twoViewConfig}
      />,
        { attachTo: div });

      waitForTilesLoaded(hgc, done);
    });

    it('Ensures that the custom color map loads properly', (done) => {
      // console.log('heatmap options:', HeatmapOptions);

      hgc.instance().tiledPlots.aa.handleConfigureTrack(
        twoViewConfig.views[0].tracks.center[0].contents[0],
        HeatmapOptions);

      waitForTilesLoaded(hgc, done);
    });
  });

  return;

  describe('Value scale locking', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'height:800px; width:800px');
      div.setAttribute('id', 'single-view');
      hgc = mount(<HiGlassComponent
        options={{ bounded: true }}
        viewConfig={twoViewConfig}
      />,
        { attachTo: div });

      waitForTilesLoaded(hgc, done);
    });

    it('locks the scales and recenters the page', (done) => {
      hgc.instance().handleValueScaleLocked('aa', 'heatmap1', 'view2', 'heatmap2');
      const track1 = hgc.instance().tiledPlots.aa.trackRenderer.getTrackObject('heatmap1');
      const track2 = hgc.instance().tiledPlots.view2.trackRenderer.getTrackObject('heatmap2');

      // zoom out a little bit
      hgc.instance().tiledPlots.aa.trackRenderer.setCenter(1799432348.8692136, 1802017603.5768778, 28874.21283197403);

      // setTimeout(() => done(), tileLoadTime);
      waitForTilesLoaded(hgc, done);
    });

    it ('exports as JSON and makes sure that the scales are locked', (done) => {
      let data = hgc.instance().getViewsAsString();

      expect(data).to.contain('valueScaleLocks');

      done();
    });

    it('Moves the brush on one view and makes sure it moves on the other', (done) => {
      const heatmapTrack = getTrackObject(hgc, 'aa', 'heatmap1');

      // console.log('lvs1', heatmapTrack.limitedValueScale.domain());

      // move the brush down to limit the amount of visible data
      heatmapTrack.gColorscaleBrush.call(heatmapTrack.scaleBrush.move,
        [0, 100]);

      // console.log('lvs2', heatmapTrack.limitedValueScale.domain());

      const heatmap2Track = getTrackObject(hgc, 'view2', 'heatmap2');

      expect(heatmapTrack.options.scaleStartPercent).to.eql(heatmap2Track.options.scaleStartPercent);
      expect(heatmapTrack.options.scaleEndPercent).to.eql(heatmap2Track.options.scaleEndPercent);

      // setTimeout(done, tileLoadTime);
      waitForTilesLoaded(hgc, done);
    });


    it('Changes the value scale', (done) => {
      const heatmapTrack = getTrackObject(hgc, 'aa', 'heatmap1');

      hgc.instance().tiledPlots.aa.trackRenderer.setCenter(179943234.8692136, 180201760.5768778, 2887.21283197403);

      waitForTilesLoaded(hgc, done);
    });


    it('ensures that the new track domains are equal and unlocks the scales', (done) => {
      const track1 = hgc.instance().tiledPlots.aa.trackRenderer.getTrackObject('heatmap1');
      const track2 = hgc.instance().tiledPlots.view2.trackRenderer.getTrackObject('heatmap2');

      const domain1 = track1.valueScale.domain();
      const domain2 = track2.valueScale.domain();

      expect(domain1[1]).to.eql(domain2[1]);

      hgc.instance().handleUnlockValueScale('aa', 'heatmap1');

      // unlock the scales and zoom out
      hgc.instance().tiledPlots.aa.trackRenderer.setCenter(1799432348.8692136, 1802017603.5768778, 2887.21283197403);

      waitForTilesLoaded(hgc, done);
    });

    it('ensure that new domains are unequal and locks the combined tracks', (done) => {
      const track1 = hgc.instance().tiledPlots.aa.trackRenderer.getTrackObject('heatmap1');
      const track2 = hgc.instance().tiledPlots.view2.trackRenderer.getTrackObject('heatmap2');

      const domain1 = track1.valueScale.domain();
      const domain2 = track2.valueScale.domain();

      expect(domain1[1]).to.not.eql(domain2[1]);

      waitForTilesLoaded(hgc, done);
    });


    it('Locks line and combined scales', (done) => {
      hgc.instance().handleValueScaleLocked('aa', 'c1', 'view2', 'c2');
      hgc.instance().handleValueScaleLocked('aa', 'line1', 'view2', 'line2');

      // lock the scales of two combined views
      hgc.instance().tiledPlots.aa.trackRenderer.setCenter(2268041199.8615317, 2267986087.2543955, 15.803061962127686);

      waitForTilesLoaded(hgc, done);
    });

    it('ensures that the new track domains are equal and unlock the combined tracks', (done) => {
      const track1 = hgc.instance().tiledPlots.aa.trackRenderer.getTrackObject('heatmap1');
      const track2 = hgc.instance().tiledPlots.view2.trackRenderer.getTrackObject('heatmap2');

      const domain1 = track1.valueScale.domain();
      const domain2 = track2.valueScale.domain();

      expect(domain1[1]).to.be.above(1000);
      expect(domain1[1]).to.eql(domain2[1]);

      waitForTilesLoaded(hgc, done);
    });

    it('ensures that the lines have the same valueScale', (done) => {
      const track1 = hgc.instance().tiledPlots.aa.trackRenderer.getTrackObject('line1');
      const track2 = hgc.instance().tiledPlots.view2.trackRenderer.getTrackObject('line2');

      const domain1 = track1.valueScale.domain();
      const domain2 = track2.valueScale.domain();

      // add the track1 medianVisibleValue to account for the offset that is
      // added to log-scaled tracks
      expect(domain1[1]).to.eql(domain2[1] + track1.medianVisibleValue);

      waitForTilesLoaded(hgc, done);
    });

    it('zooms out', (done) => {
      hgc.instance().tiledPlots.aa.trackRenderer.setCenter(2268233532.6257076, 2268099618.396191, 1710.4168190956116);

      waitForTilesLoaded(hgc, done);
    });

    it('ensures that the domain changed', (done) => {
      const track1 = hgc.instance().tiledPlots.aa.trackRenderer.getTrackObject('heatmap1');
      const track2 = hgc.instance().tiledPlots.view2.trackRenderer.getTrackObject('heatmap2');

      const domain1 = track1.valueScale.domain();
      const domain2 = track2.valueScale.domain();

      expect(domain1[1]).to.be.below(1);
      expect(domain1[1]).to.eql(domain2[1]);

      waitForTilesLoaded(hgc, done);
    });

    it('Unlocks the scales and moves to a different location', (done) => {
      hgc.instance().handleUnlockValueScale('aa', 'c1');

      // unlock the scales and zoom out
      hgc.instance().tiledPlots.aa.trackRenderer.setCenter(1799432348.8692136, 1802017603.5768778, 2887.21283197403);

      waitForTilesLoaded(hgc, done);
    });

    it('ensures that the new track domains are not equal', (done) => {
      const track1 = hgc.instance().tiledPlots.aa.trackRenderer.getTrackObject('heatmap1');
      const track2 = hgc.instance().tiledPlots.view2.trackRenderer.getTrackObject('heatmap2');

      const domain1 = track1.valueScale.domain();
      const domain2 = track2.valueScale.domain();

      expect(domain1[1]).to.not.eql(domain2[1]);

      // hgc.instance().handleUnlockValueScale('aa', 'heatmap1');

      // unlock the scales and zoom out
      // hgc.instance().tiledPlots['aa'].trackRenderer.setCenter(1799432348.8692136, 1802017603.5768778, 2887.21283197403);
      // setTimeout(() => done(), tileLoadTime);

      done();
    });

    it('Lock view scales ', (done) => {
      hgc.instance().handleZoomLockChosen('aa', 'view2');
      hgc.instance().handleLocationLockChosen('aa', 'view2');

      done();
    });

    it('locks the value scales ', (done) => {
      // lock the value scales to ensure that removing the track doesn't
      // lead to an error
      hgc.instance().handleValueScaleLocked('aa', 'c1', 'view2', 'heatmap2');

      done();
    });

    it('Replaces and displays a new track', (done) => {
      hgc.instance().handleCloseTrack('view2', 'c2');
      hgc.instance().handleTrackAdded('view2', heatmapTrack, 'center');

      hgc.instance().tiledPlots.view2.render();
      hgc.instance().tiledPlots.view2.trackRenderer.setCenter(
        1799508622.8021536, 1801234331.7949603, 17952.610495328903);

      hgc.instance().tiledPlots.view2
        .trackRenderer.syncTrackObjects(
          hgc.instance().tiledPlots.view2.positionedTracks());

      done();
    });

    it('Checks to make sure that the tracks are no longer locked', (done) => {
      const uid = hgc.instance().combineViewAndTrackUid('aa', 'heatmap1');
      const lockGroupValues = dictValues(hgc.instance().valueScaleLocks[uid]);

      done();
    });

    it('Replaces and displays a new track', (done) => {
      // hgc.instance().handleValueScaleLocked('aa', 'c1', 'view2', 'heatmap3');

      const track = hgc.instance().tiledPlots.view2.trackRenderer.getTrackObject('heatmap3');

      // make sure that the newly added track is rendered
      expect(track.pMain.position.x).to.be.above(404);
      expect(track.pMain.position.x).to.be.below(406);

      // setTimeout(() => done(), tileLoadTime);
      waitForTilesLoaded(hgc, done);
    });

    it('Locks the scales again (after waiting for the previous tiles to load)', (done) => {
      hgc.instance().handleValueScaleLocked('aa', 'c1', 'view2', 'heatmap3');

      const track1 = hgc.instance().tiledPlots.aa.trackRenderer.getTrackObject('heatmap1');
      const track2 = hgc.instance().tiledPlots.view2.trackRenderer.getTrackObject('heatmap3');

      const domain1 = track1.valueScale.domain();
      const domain2 = track2.valueScale.domain();

      done();
    });
  });

  describe('Divergent tracks', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'height:800px; width:800px');
      div.setAttribute('id', 'single-view');
      hgc = mount(<HiGlassComponent
        options={{ bounded: true }}
        viewConfig={divergentTrackConfig}
      />,
        { attachTo: div });

      hgc.update();
      waitForTilesLoaded(hgc, done);
    });

    it ('Exports the views as SVG', (done) => {
      //hgc.instance().handleExportSVG();

      done();
    });
  });

  //
  // wait a bit of time for the data to be loaded from the server
  describe('Double view', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'height:800px; width:800px');
      div.setAttribute('id', 'single-view');
      hgc = mount(<HiGlassComponent
        options={{ bounded: true }}
        viewConfig={twoViewConfig}
      />,
        { attachTo: div });

      hgc.update();
      waitForTilesLoaded(hgc, done);
    });

    it('has a colorbar', () => {
      const heatmap = hgc.instance().tiledPlots.aa.trackRenderer
        .trackDefObjects.c1.trackObject.createdTracks.heatmap1;
      expect(heatmap.pColorbarArea.x).to.be.below(heatmap.dimensions[0] / 2);

      const selection = select(ReactDOM.findDOMNode(hgc.instance()))
        .selectAll('.selection');

      // we expect a colorbar selector brush to be visible
      // in both views
      expect(selection.size()).to.eql(2);
    });

    it('hides the colorbar', () => {
      const views = hgc.instance().state.views;

      const track = getTrackByUid(views.aa.tracks, 'heatmap1');
      track.options.colorbarPosition = 'hidden';

      hgc.instance().setState(
        views: views,
      );

      const selection = select(ReactDOM.findDOMNode(hgc.instance()))
        .selectAll('.selection');

      // we expect a colorbar selector brush to be hidden
      // in one of the views
      expect(selection.size()).to.be.eql(1);

      track.options.colorbarPosition = 'topLeft';
      hgc.instance().setState(
        views: views,
      );
    });


    it('changes the colorbar color when the heatmap colormap is changed', () => {
      hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);
      let newOptions = {
        colorRange: [
          'white',
          'black',
        ],
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'heatmap1', newOptions);

      const svg = getTrackObject(hgc, 'aa', 'heatmap1').exportSVG()[0];
      // hgc.instance().handleExportSVG();

      // how do we test for what's drawn in Pixi?'

      const oldOptions = {
        colorRange: [
          'white',
          'rgba(245,166,35,1.0)',
          'rgba(208,2,27,1.0)',
          'black',
        ],
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'heatmap1', oldOptions);
    });

    it('switches between log and linear scales', () => {
      const newOptions = {
        labelColor: 'red',
        labelPosition: 'hidden',
        axisPositionHorizontal: 'right',
        lineStrokeColor: 'blue',
        name: 'wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile',
        valueScaling: 'linear',
      };

      expect(getTrackObject(hgc, 'aa', 'line1').options.valueScaling).to.eql('log');
      hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);
      expect(getTrackObject(hgc, 'aa', 'line1').options.valueScaling).to.eql('linear');

      newOptions.valueScaling = 'log';
      hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

      // hgc.update();
    });

    it('exports SVG', () => {
      const svg = hgc.instance().createSVG();
      const svgText = new XMLSerializer().serializeToString(svg);

      // hgc.instance().handleExportSVG();

      // Make sure we have an axis that is offset from the origin
      // expect(svgText.indexOf('id="axis" transform="translate(390, 68)"')).to.be.above(0);

      // make sure that we have this color in the colorbar (this is part of the custard
      // color map)
      expect(svgText.indexOf('rgb(231, 104, 32)')).to.be.above(0);

      // make sure that this color, which is part of the afmhot colormap is not exported
      expect(svgText.indexOf('rgb(171, 43, 0)')).to.be.below(0);


      const tdo = hgc.instance().tiledPlots.aa.trackRenderer.trackDefObjects;

      const line1 = hgc.instance().tiledPlots.aa.trackRenderer.trackDefObjects.line1.trackObject;

      const axis = line1.axis.exportAxisRightSVG(line1.valueScale, line1.dimensions[1]);
      const axisText = new XMLSerializer().serializeToString(axis);

      // hgc.instance().handleExportSVG();

      // let axis = svg.getElementById('axis');
      // make sure we have a tick mark for 200000
      expect(axisText.indexOf('1e+5')).to.be.above(0);
    });

    it('Adds a chromInfo track', (done) => {
      // this test was here to visually make sure that the HorizontalChromosomeAxis
      // was rendered after being drawn
      hgc.instance().handleTrackAdded('view2', chromInfoTrack, 'top');

      hgc.instance().tiledPlots.view2.render();
      hgc.instance().tiledPlots.view2
        .trackRenderer.syncTrackObjects(
          hgc.instance().tiledPlots.view2.positionedTracks());

      // make sure that the chromInfo is displayed
      setTimeout(() => done(), tileLoadTime);
    });

    it('replaces a track', (done) => {
      done();
    });
  });

  describe('View positioning', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'height:300px;width:300px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent
        options={{ bounded: true }}
        viewConfig={simpleCenterViewConfig}
      />, { attachTo: div });

      const view = simpleCenterViewConfig.views[0];
      const midY = (view.initialYDomain[0] + view.initialYDomain[1]) / 2;

      hgc.instance().onViewChange((viewconf) => {
        const view = JSON.parse(viewconf).views[0];
        const newMidY = (view.initialYDomain[0] + view.initialYDomain[1]) / 2;

        expect(midY).to.eql(newMidY);
      });
      hgc.update();
      waitForTilesLoaded(hgc, done);

      // visual check that the heatmap track config menu is moved
      // to the left
    });

    it ('Gets and sets the viewconfig', (done) => {
      const viewConf = hgc.instance().getViewsAsString();

      const newViews = hgc.instance().processViewConfig(JSON.parse(viewConf));
      hgc.setState({
        viewsByUid: newViews,
      });

      done();
    });

  });

  describe('The API', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent
        options={{ bounded: false }}
        viewConfig={simpleCenterViewConfig}
      />, { attachTo: div });

      hgc.update();
      waitForTilesLoaded(hgc, done);

      // visual check that the heatmap track config menu is moved
      // to the left
    });

    it ('Sets a new viewconfig', (done) => {
      const p = hgc.instance().api.setViewConfig(twoViewConfig);

      p.then(() => {
        // should only be called when all the tiles are loaded
        done();
      });
    });

    it ('Zooms one of the views to the center', (done) => {
      hgc.instance().api.zoomToDataExtent('view2');

      done();
    });

    it ('Zooms a nonexistant view to the center', (done) => {
      const badFn = () => hgc.instance().api.zoomToDataExtent('xxx');

      expect(badFn).to.throw();
      done();
    });
  });

  describe('Color scale limiting', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'height:800px; width:800px');
      div.setAttribute('id', 'single-view');
      hgc = mount(<HiGlassComponent
        options={{ bounded: true }}
        viewConfig={twoViewConfig}
      />,
        { attachTo: div });

      /*
            for (let viewId of hgc.instance().iterateOverViews()) {
                let tp = getTiledPlot(hgc, viewId);
      //let tpWrapper = new ReactWrapper(getTiledPlot(hgc, viewId), true);
                console.log('measured size');
                tp.measureSize();
                hgc.update();
                tp.trackRenderer.syncTrackObjects(tp.positionedTracks());
                console.log('positionedTracks', tp.positionedTracks());
                tp.trackRenderer.applyZoomTransform(false);
  //tpWrapper.setState(tp.state);
            }
            */

      // hgc.update();

      // console.log('starting wait');
      waitForTilesLoaded(hgc, done);
    });

    it('Changes the position of the brush to the top right', (done) => {
      const views = hgc.instance().state.views;
      views.aa.tracks.center[0].contents[0].options.colorbarPosition = 'topRight';

      hgc.instance().setState({ views });

      done();
    });


    it('Moves the brush on one of the views', (done) => {
      const heatmapTrack = getTrackObject(hgc, 'aa', 'heatmap1');

      const domain1 = heatmapTrack.limitedValueScale.domain();


      heatmapTrack.gColorscaleBrush.call(heatmapTrack.scaleBrush.move,
        [0, 100]);

      const domain2 = heatmapTrack.limitedValueScale.domain();

      // we don't expect the other view to change
      expect(domain1[0]).to.not.eql(domain2[0]);

      /*
      console.log('domain1:', domain1);
      console.log('domain2:', domain2);
      */

      done();
    });

    it('locks the scales and recenters the page', (done) => {
      hgc.instance().handleValueScaleLocked('aa', 'heatmap1', 'view2', 'heatmap2');
      const track1 = hgc.instance().tiledPlots.aa.trackRenderer.getTrackObject('heatmap1');
      const track2 = hgc.instance().tiledPlots.view2.trackRenderer.getTrackObject('heatmap2');

      // zoom out a little bit
      hgc.instance().tiledPlots.aa.trackRenderer.setCenter(1799432348.8692136, 1802017603.5768778, 28874.21283197403);

      // setTimeout(() => done(), tileLoadTime);
      waitForTilesLoaded(hgc, done);
    });

    it('Moves the brush on one view and makes sure it moves on the other', (done) => {
      const heatmapTrack = getTrackObject(hgc, 'aa', 'heatmap1');

      // console.log('lvs1', heatmapTrack.limitedValueScale.domain());

      // move the brush down to limit the amount of visible data
      heatmapTrack.gColorscaleBrush.call(heatmapTrack.scaleBrush.move,
        [0, 100]);

      // console.log('lvs2', heatmapTrack.limitedValueScale.domain());

      const heatmap2Track = getTrackObject(hgc, 'view2', 'heatmap2');

      expect(heatmapTrack.options.scaleStartPercent).to.eql(heatmap2Track.options.scaleStartPercent);
      expect(heatmapTrack.options.scaleEndPercent).to.eql(heatmap2Track.options.scaleEndPercent);

      done();
    });

  });

  describe('Add overlay tracks', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      beforeAll((done) => {
        // wait for the page to load
        testAsync(done);
      });

      hgc = mount(<HiGlassComponent
        options={{ bounded: false }}
        viewConfig={oneZoomedOutViewConf}
      />,
        { attachTo: div });

      waitForJsonComplete(done);
    });

    it('Add the grid', (done) => {
      hgc.instance().handleTracksAdded('aa', [chromosomeGridTrack], 'center');

      hgc.instance().setState(hgc.instance().state);

      waitForJsonComplete(done);
    });

    it('Should show a grid', (done) => {
      const outputJSON = JSON.parse(hgc.instance().getViewsAsString());

      expect(outputJSON.views[0].tracks.center[0]).to.have.property('contents');

      // should have two tracks
      expect(outputJSON.views[0].tracks.center[0].contents.length).to.be.above(1);

      waitForJsonComplete(done);
    });
  });

  describe('Colormap tests', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'height:800px; width:800px');
      div.setAttribute('id', 'single-view');
      hgc = mount(<HiGlassComponent
        options={{ bounded: true }}
        viewConfig={twoViewConfig}
      />,
        { attachTo: div });

      waitForTilesLoaded(hgc, done);
    });

    it('Ensures that the custom color map loads properly', (done) => {
      // console.log('heatmap options:', HeatmapOptions);

      hgc.instance().tiledPlots.aa.handleConfigureTrack(
        twoViewConfig.views[0].tracks.center[0].contents[0],
        HeatmapOptions);

      waitForTilesLoaded(hgc, done);
    });
  });

  describe('Close view tests', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'height:800px; width:800px');
      div.setAttribute('id', 'single-view');
      hgc = mount(<HiGlassComponent
        options={{ bounded: true }}
        viewConfig={twoViewConfig}
      />,
        { attachTo: div });

      waitForTilesLoaded(hgc, done);
    });

    it('Ensures that when a view is closed, the PIXI graphics are removed', (done) => {
      hgc.instance().handleCloseView('view2');

      // console.log('hgc.instance:', hgc.instance().pixiStage.children);
      // hgc.setState(hgc.instance().state);

      // console.log('checking...', hgc.instance().pixiStage.children);
      // since we removed one of the children, there should be only one left
      expect(hgc.instance().pixiStage.children.length).to.eql(1);

      waitForTilesLoaded(hgc, done);
    });
  });

  describe('Multiple track addition', () => {
    let atm = null;

    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent
        options={{ bounded: false }}
        viewConfig={oneViewConfig}
      />,
        { attachTo: div });

      waitForTilesLoaded(hgc, done);
    });

    it('should open the AddTrackModal', (done) => {
      // this was to test an example from the higlass-website demo page
      // where the issue was that the genome position search box was being
      // styled with a margin-bottom of 10px, fixed by setting the style of
      // genome-position-search to specify margin-bottom app/styles/GenomePositionSearchBox.css
      const tiledPlot = hgc.instance().tiledPlots.aa;
      tiledPlot.handleAddTrack('top');

      hgc.update();

      atm = tiledPlot.addTrackModal;
      const inputField = ReactDOM.findDOMNode(atm.tilesetFinder.searchBox);

      // make sure the input field is equal to the document's active element
      // e.g. that it has focus
      expect(inputField).to.be.eql(document.activeElement);

      waitForJsonComplete(done);
    });

    it('should select one plot type and double click', (done) => {
      const tilesetFinder = atm.tilesetFinder;
      tilesetFinder.handleSelectedOptions(['http://higlass.io/api/v1/CQMd6V_cRw6iCI_-Unl3PQ']);
      hgc.update();

      tilesetFinder.props.onDoubleClick(tilesetFinder.state.options['http://higlass.io/api/v1/CQMd6V_cRw6iCI_-Unl3PQ']);

      waitForJsonComplete(done);
    });

    it('should reopen the AddTrackModal', (done) => {
      // open up the add track dialog for the next tests
      const tiledPlot = hgc.instance().tiledPlots.aa;
      tiledPlot.handleAddTrack('top');
      hgc.update();
      atm = tiledPlot.addTrackModal;
      waitForJsonComplete(done);
    });

    it('should select two different plot types', (done) => {
      const tilesetFinder = atm.tilesetFinder;

      tilesetFinder.handleSelectedOptions(['http://higlass.io/api/v1/TO3D5uHjSt6pyDPEpc1hpA', 'http://higlass.io/api/v1/Nn8aA4qbTnmaa-oGGbuE-A']);

      hgc.update();

      waitForTilesLoaded(hgc, done);
    });

    it('should add these plot types', (done) => {
      atm.handleSubmit();

      const tiledPlot = hgc.instance().tiledPlots.aa;
      tiledPlot.handleAddTrack('top');

      hgc.update();

      atm = tiledPlot.addTrackModal;

      waitForJsonComplete(done);
    });

    it('should select a few different tracks and check for the plot type selection', (done) => {
      const tilesetFinder = atm.tilesetFinder;

      tilesetFinder.handleSelectedOptions(['http://higlass.io/api/v1/CQMd6V_cRw6iCI_-Unl3PQ',
        'http://higlass.io/api/v1/GUm5aBiLRCyz2PsBea7Yzg']);

      hgc.update();

      let ptc = atm.plotTypeChooser;

      console.log('ptc:', ptc);

      expect(ptc.AVAILABLE_TRACK_TYPES.length).to.eql(0);

      tilesetFinder.handleSelectedOptions(['http://higlass.io/api/v1/NNlxhMSCSnCaukAtdoKNXw',
        'http://higlass.io/api/v1/GGKJ59R-RsKtwgIgFohOhA']);

      hgc.update();

      ptc = atm.plotTypeChooser;


      // should just have the horizontal-heatmap track type
      expect(ptc.AVAILABLE_TRACK_TYPES.length).to.eql(1);

      done();
    });

    it('should add the selected tracks', (done) => {
      // atm.unmount();
      atm.handleSubmit();
      // hgc.update();
      const viewConf = JSON.parse(hgc.instance().getViewsAsString());

      expect(viewConf.views[0].tracks.top.length).to.eql(6);

      hgc.update();

      done();
    });
  });

  describe('Three views and linking', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }


      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'height:400px; width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent
        options={{ bounded: true }}
        viewConfig={threeViews}
      />,
        { attachTo: div });

      waitForTilesLoaded(hgc, done);
    });

    it('Links two views and moves to the side', (done) => {
      hgc.instance().handleLocationLockChosen('aa', 'bb');
      hgc.instance().handleZoomLockChosen('aa', 'bb');

      hgc.instance().tiledPlots.aa.trackRenderer.setCenter(
        1799508622.8021536, 1801234331.7949603, 17952.610495328903);
      waitForTilesLoaded(hgc, done);
    });

    it('Checks to make sure that the two views have moved to the same place', (done) => {
      const aaXScale = hgc.instance().xScales.aa;
      const aaYScale = hgc.instance().yScales.aa;

      const bbXScale = hgc.instance().xScales.bb;
      const bbYScale = hgc.instance().yScales.bb;

      const [aaCenterX, aaCenterY, aaK] = scalesCenterAndK(aaXScale, aaYScale);
      const [bbCenterX, bbCenterY, bbK] = scalesCenterAndK(bbXScale, bbYScale);

      expect(aaCenterX - bbCenterX).to.be.below(0.001);
      expect(aaCenterY - bbCenterY).to.be.below(0.001);

      done();
    });

    it('Links the third view', (done) => {
      hgc.instance().handleLocationYanked('cc', 'aa');
      hgc.instance().handleZoomYanked('cc', 'aa');

      hgc.instance().handleLocationLockChosen('bb', 'cc');
      hgc.instance().handleZoomLockChosen('bb', 'cc');

      hgc.instance().tiledPlots.aa.trackRenderer.setCenter(
        1799509622.8021536, 1801244331.7949603, 17952.610495328903);

      waitForTilesLoaded(hgc, done);
    });

    it('Makes sure that the third view moved', (done) => {
      const aaXScale = hgc.instance().xScales.aa;
      const aaYScale = hgc.instance().yScales.aa;

      const ccXScale = hgc.instance().xScales.cc;
      const ccYScale = hgc.instance().yScales.cc;

      const [aaCenterX, aaCenterY, aaK] = scalesCenterAndK(aaXScale, aaYScale);
      const [ccCenterX, ccCenterY, ccK] = scalesCenterAndK(ccXScale, ccYScale);

      expect(aaCenterX - ccCenterX).to.be.below(0.001);
      expect(aaCenterY - ccCenterY).to.be.below(0.001);


      waitForTilesLoaded(hgc, done);
    });
  });

  describe('AddTrackModal', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'height:400px; width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent
        options={{ bounded: true }}
        viewConfig={oneViewConfig}
      />,
        { attachTo: div });

      waitForTilesLoaded(hgc, done);
    });

    it('has the focus in the searchbar when adding a new track', (done) => {
      const tiledPlot = hgc.instance().tiledPlots.aa;
      tiledPlot.handleAddTrack('top');

      hgc.update();

      const inputField = ReactDOM.findDOMNode(tiledPlot.addTrackModal.tilesetFinder.searchBox);

      // make sure the input field is equal to the document's active element
      // e.g. that it has focus
      expect(inputField).to.be.eql(document.activeElement);

      waitForTilesLoaded(hgc, done);
    });
  });

  describe('1D viewport projection', () => {
    let vpUid = null;
    let vp2DUid = null;

    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      const newViewConf = JSON.parse(JSON.stringify(project1D));

      const center1 = JSON.parse(JSON.stringify(heatmapTrack));
      center1.height = 200;
      const center2 = JSON.parse(JSON.stringify(heatmapTrack));
      center2.height = 200;

      newViewConf.views[0].tracks.center = [center1];
      newViewConf.views[1].tracks.center = [center2];

      newViewConf.views[0].layout.h = 10;
      newViewConf.views[1].layout.h = 10;

      hgc = mount(<HiGlassComponent
        options={{ bounded: false }}
        viewConfig={newViewConf}
      />,
        { attachTo: div });

      waitForTilesLoaded(hgc, done);
    });

    it('Should lock the location without throwing an error', (done) => {
      hgc.instance().handleLocationLockChosen('aa', 'bb');
      // the viewconf contains a location lock, we need to ignore it
      //
      const track = getTrackObject(hgc, 'bb', 'line2');
      expect(track.labelText.text.indexOf('hg19')).to.eql(0);

      const overlayElements = document.getElementsByClassName('overlay');

      // there should be two colorbars
      expect(overlayElements.length).to.eql(2);

      waitForTilesLoaded(hgc, done);
    });

    it('Should add a vertical viewport projection', (done) => {
      vpUid = hgc.instance().handleViewportProjected('bb', 'aa', 'vline1');
      // hgc.instance().tiledPlots['aa'].trackRenderer.setCenter(2540607259.217122,2541534691.921077,195.2581009864807);
      // move the viewport just a little bit
      const overlayElements = document.getElementsByClassName('overlay');

      // we should have created an overlay element
      expect(overlayElements.length).to.eql(3);

      waitForTilesLoaded(hgc, done);
    });

    it('Should project the viewport of view2 onto the gene annotations track', (done) => {
      vpUid = hgc.instance().handleViewportProjected('bb', 'aa', 'ga1');
      hgc.instance().tiledPlots.aa.trackRenderer.setCenter(2540607259.217122, 2541534691.921077, 195.2581009864807);
      // move the viewport just a little bit
      //
      waitForTilesLoaded(hgc, done);
    });

    it('Should make sure that the track labels still contain the assembly', (done) => {
      const track = getTrackObject(hgc, 'bb', 'line2');
      expect(track.labelText.text.indexOf('hg19')).to.eql(0);
      waitForTilesLoaded(hgc, done);
    });

    it('Add a 2D vertical projection and move the lower track to different location', (done) => {
      const track = getTrackObject(hgc, 'bb', 'line2');

      hgc.instance().tiledPlots.bb.trackRenderer.setCenter(2540607259.217122, 2541534691.921077, 87.50166702270508);
      vp2DUid = hgc.instance().handleViewportProjected('bb', 'aa', 'heatmap3');

      waitForTilesLoaded(hgc, done);
    });

    it('Resize the 1D projection', (done) => {
      const viewportTracker = getTrackObject(hgc, 'aa', vpUid);
      const viewport2DTracker = getTrackObject(hgc, 'aa', vp2DUid);

      // the 2D viewport tracker domains shouldn't change
      const preResizeYDomain = viewport2DTracker.viewportYDomain;
      viewportTracker.setDomainsCallback([2540588996.465288, 2540640947.3589344],
        [2541519510.3818445, 2541549873.460309]);

      const postResizeYDomain = JSON.parse(JSON.stringify(viewport2DTracker.viewportYDomain));

      expect(preResizeYDomain[1] - postResizeYDomain[1]).to.be.below(0.0001);
      expect(preResizeYDomain[1] - postResizeYDomain[1]).to.be.below(0.0001);

      waitForTilesLoaded(hgc, done);
    });
  });

  describe('Single view', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent
        options={{ bounded: false }}
        viewConfig={oneViewConfig}
      />,
        { attachTo: div });

      waitForTilesLoaded(hgc, done);
    });

    it('should load the initial config', (done) => {
      waitForTilesLoaded(hgc, done);
    });

    it('Changes the axis to inner right', (done) => {
      const newOptions = {
        axisPositionHorizontal: 'right',
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

      const track = getTrackObject(hgc, 'aa', 'line1');
      const pAxis = track.axis.pAxis;

      // we want the axis labels to be to the left of the end of the track
      expect(pAxis.position.x).to.be.above(track.position[0]);
      expect(pAxis.children[0].x).to.be.below(0);

      waitForTilesLoaded(hgc, done);
    });

    it('Changes the axis to outside right', (done) => {
      const newOptions = {
        axisPositionHorizontal: 'outsideRight',
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

      const track = getTrackObject(hgc, 'aa', 'line1');
      const pAxis = track.axis.pAxis;


      // we want the axis labels to be to the left of the end of the track
      expect(pAxis.position.x).to.be.above(track.position[0]);
      expect(pAxis.children[0].x).to.be.above(0);

      waitForTilesLoaded(hgc, done);
    });

    it('Changes the axis to outside left', (done) => {
      const newOptions = {
        axisPositionHorizontal: 'outsideLeft',
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

      const track = getTrackObject(hgc, 'aa', 'line1');
      const pAxis = track.axis.pAxis;

      // we want the axis labels to be to the left of the end of the track
      expect(pAxis.position.x).to.be.eql(track.position[0]);
      expect(pAxis.children[0].x).to.be.below(0);

      waitForTilesLoaded(hgc, done);
    });

    it('Changes the axis to the left', (done) => {
      const newOptions = {
        axisPositionHorizontal: 'left',
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

      const track = getTrackObject(hgc, 'aa', 'line1');
      const pAxis = track.axis.pAxis;

      // we want the axis labels to be to the left of the end of the track
      expect(pAxis.position.x).to.be.eql(track.position[0]);
      expect(pAxis.children[0].x).to.be.above(0);

      waitForTilesLoaded(hgc, done);
    });

    it('Changes the axis to the top', (done) => {
      const newOptions = {
        axisPositionHorizontal: null,
        axisPositionVertical: 'top',
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'vline1', newOptions);

      const track = getTrackObject(hgc, 'aa', 'vline1').originalTrack;
      const pAxis = track.axis.pAxis;

      // we want the axis labels to be to the left of the end of the track
      expect(pAxis.position.x).to.be.eql(track.position[0]);
      expect(pAxis.children[0].x).to.be.above(0);

      waitForTilesLoaded(hgc, done);
    });

    it('Changes the axis to the outside top', (done) => {
      const newOptions = {
        axisPositionHorizontal: null,
        axisPositionVertical: 'outsideTop',
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'vline1', newOptions);

      const track = getTrackObject(hgc, 'aa', 'vline1').originalTrack;
      const pAxis = track.axis.pAxis;

      // we want the axis labels to be to the left of the end of the track
      expect(pAxis.position.x).to.be.eql(track.position[0]);
      expect(pAxis.children[0].x).to.be.below(0);

      waitForTilesLoaded(hgc, done);
    });

    it('Changes the axis to the outside bottom', (done) => {
      const newOptions = {
        axisPositionHorizontal: null,
        axisPositionVertical: 'outsideBottom',
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'vline1', newOptions);

      const track = getTrackObject(hgc, 'aa', 'vline1').originalTrack;
      const pAxis = track.axis.pAxis;

      // we want the axis labels to be to the left of the end of the track
      expect(pAxis.position.x).to.be.above(track.position[0]);
      expect(pAxis.children[0].x).to.be.above(0);

      waitForTilesLoaded(hgc, done);
    });

    it('Changes the axis to the bottom', (done) => {
      const newOptions = {
        axisPositionVertical: 'bottom',
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'vline1', newOptions);

      const track = getTrackObject(hgc, 'aa', 'vline1').originalTrack;
      const pAxis = track.axis.pAxis;

      // we want the axis labels to be to the left of the end of the track
      expect(pAxis.position.x).to.be.above(track.position[0]);
      expect(pAxis.children[0].x).to.be.below(0);

      waitForTilesLoaded(hgc, done);
    });
  });

  describe('Track addition and removal', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent
        options={{ bounded: false }}
        viewConfig={testViewConfX2}
      />,
        { attachTo: div });

      waitForTilesLoaded(hgc, done);
    });

    it('should load the initial config', (done) => {
      // this was to test an example from the higlass-website demo page
      // where the issue was that the genome position search box was being
      // styled with a margin-bottom of 10px, fixed by setting the style of
      // genome-position-search to specify margin-bottom app/styles/GenomePositionSearchBox.css
      expect(hgc.instance().state.views.aa.layout.h).to.be.eql(6);

      done();
    });

    it('should change the opacity of the first text label to 20%', (done) => {
      const newOptions = JSON.parse(JSON.stringify(testViewConfX2.views[0].tracks.top[0].options));
      newOptions.labelTextOpacity = 0.2;

      hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);
      hgc.setState(hgc.instance().state);

      expect(getTrackObject(hgc, 'aa', 'line1').labelText.alpha).to.be.below(0.21);

      waitForTilesLoaded(hgc, done);
    });

    it('should change the stroke width of the second line to 5', (done) => {
      const newOptions = JSON.parse(JSON.stringify(testViewConfX2.views[0].tracks.top[1].options));
      newOptions.lineStrokeWidth = 5;

      hgc.instance().handleTrackOptionsChanged('aa', 'line2', newOptions);
      hgc.setState(hgc.instance().state);

      expect(getTrackObject(hgc, 'aa', 'line1').labelText.alpha).to.be.below(0.21);

      waitForTilesLoaded(hgc, done);
    });

    it('should do something else', (done) => {
      waitForTilesLoaded(hgc, done);
    });
  });

  describe('Value interval track tests', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'height:800px; width:800px');
      div.setAttribute('id', 'single-view');
      hgc = mount(<HiGlassComponent
        options={{ bounded: true }}
        viewConfig={twoViewConfig}
      />,
        { attachTo: div });

      waitForTilesLoaded(hgc, done);
    });

    it("doesn't export maxWidth or filetype", () => {
      const viewString = hgc.instance().getViewsAsString();

      // expect(viewString.indexOf('1d-value-interval')).to.be.above(0);
      expect(viewString.indexOf('maxWidth')).to.be.below(0);
      expect(viewString.indexOf('filetype')).to.be.below(0);
      expect(viewString.indexOf('binsPerDimension')).to.be.below(0);
    });
  });

  describe('Starting with an existing genome position search box', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent
        options={{ bounded: false }}
        viewConfig={onlyGPSB}
      />,
        { attachTo: div });

      hgc.update();
      waitForTilesLoaded(hgc, done);
    });

    it('Makes the search box invisible', (done) => {
      hgc.instance().handleTogglePositionSearchBox('aa');

      waitForJsonComplete(done);
    });

    it('Makes the search box visible again', (done) => {
      hgc.instance().handleTogglePositionSearchBox('aa');

      waitForJsonComplete(done);
    });

    it('Searches for strings with spaces at the beginning', (done) => {
      const gpsb = hgc.instance().genomePositionSearchBoxes.aa;

      let [range1, range2] = gpsb.searchField.searchPosition('  chr1:1-1000 & chr1:2001-3000');

      expect(range1[0]).to.eql(1);
      expect(range1[1]).to.eql(1000);

      expect(range2[0]).to.eql(2001);
      expect(range2[1]).to.eql(3000);

      [range1, range2] = gpsb.searchField.searchPosition('chr1:1-1000 & chr1:2001-3000');
      console.log('range1:', range1, 'range2:', range2);

      expect(range1[0]).to.eql(1);
      expect(range1[1]).to.eql(1000);

      done();
    });

    it('Ensures that hg38 is in the list of available assemblies', (done) => {
      expect(hgc.instance().genomePositionSearchBoxes.aa.state.availableAssemblies).to.include('hg38');
      done();
    });

    it('Selects mm9', (done) => {
      const dropdownButton = hgc.find('.assembly-pick-button');
      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('mm9');

      waitForJsonComplete(done);
    });

    it('Checks that mm9 was properly set and switches back to hg19', (done) => {
      hgc.update();
      const button = new ReactWrapper(hgc.instance().genomePositionSearchBoxes.aa.assemblyPickButton, true);
      expect(button.props().title).to.be.eql('mm9');

      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('hg19');

      waitForJsonComplete(done);
    });

    it('Checks that hg19 was properly', (done) => {
      hgc.update();
      const button = new ReactWrapper(hgc.instance().genomePositionSearchBoxes.aa.assemblyPickButton, true);
      expect(button.props().title).to.be.eql('hg19');

      waitForJsonComplete(done);
    });
  });

  describe('Window resizing', () => {
    const vpUid = null;
    const vp2DUid = null;

    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:300px; height: 400px; background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      const newViewConf = JSON.parse(JSON.stringify(project1D));

      const center1 = JSON.parse(JSON.stringify(heatmapTrack));
      const center2 = JSON.parse(JSON.stringify(heatmapTrack));

      newViewConf.views[0].tracks.center = [center1];
      newViewConf.views[1].tracks.center = [center2];

      newViewConf.views[0].layout.h = 10;
      newViewConf.views[1].layout.h = 10;

      hgc = mount(<HiGlassComponent
        options={{ bounded: true }}
        viewConfig={newViewConf}
      />,
        { attachTo: div });

      waitForTilesLoaded(hgc, done);
    });

    it('Sends a resize event to fit the current view into the window', (done) => {
      const resizeEvent = new Event('resize');

      window.dispatchEvent(resizeEvent);

      waitForTilesLoaded(hgc, done);
    });

    it('Resize the view', (done) => {
      div.setAttribute('style', 'width: 600px; height: 600px; background-color: lightgreen');
      const resizeEvent = new Event('resize');

      window.dispatchEvent(resizeEvent);

      waitForTilesLoaded(hgc, done);
    });

    it('Expect the the chosen rowHeight to be less than 24', (done) => {
      expect(hgc.instance().state.rowHeight).to.be.below(24);

      waitForTilesLoaded(hgc, done);
    });
  });

  describe('Track Resizing', () => {
    const atm = null;

    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:600px;height:600px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent
        options={{ bounded: true }}
        viewConfig={oneTrackConfig}
      />,
        { attachTo: div });

      waitForTilesLoaded(hgc, done);
    });

    it('Resizes one track ', (done) => {
      const tp = getTiledPlot(hgc, 'aa');

      tp.handleResizeTrack('line1', 289, 49);

      // tp.setState(tp.state);
      waitForTilesLoaded(hgc, done);
    });

    it('Ensures that the track object was resized', (done) => {
      const track = getTrackObject(hgc, 'aa', 'line1');

      expect(track.dimensions[1]).to.eql(49);

      waitForTilesLoaded(hgc, done);
    });
  });

  describe('Track positioning', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent
        options={{ bounded: false }}
        viewConfig={horizontalDiagonalTrackViewConf}
      />,
        { attachTo: div });

      waitForTilesLoaded(hgc, done);
    });

    it('should add and resize a vertical heatmp', (done) => {
      hgc.instance().handleTrackAdded('aa', verticalHeatmapTrack, 'left');
      hgc.instance().state.views.aa.tracks.left[0].width = 100;

      hgc.setState(hgc.instance().state);
      hgc.instance().tiledPlots.aa.measureSize();

      const track = getTrackObject(hgc, 'aa', 'vh1');

      expect(track.originalTrack.axis.track.flipText).to.eql(true);

      waitForTilesLoaded(hgc, done);
    });

    it('Should flip the vertical heatmap', (done) => {
      const views = hgc.instance().state.views;
      const track = getTrackByUid(views.aa.tracks, 'vh1');

      track.options.oneDHeatmapFlipped = 'yes';

      const trackObj = getTrackObject(hgc, 'aa', 'vh1').originalTrack;
      hgc.setState({
        views,
      });

      // make sure the heatmap was flipped
      expect(trackObj.pMain.scale.y).to.be.below(0);

      done();
    });

    it('Should remove the vertical heatmap', (done) => {
      hgc.instance().handleCloseTrack('aa', 'vh1');
      hgc.setState(hgc.instance().state);
      hgc.instance().tiledPlots.aa.measureSize();

      // setTimeout(done, shortLoadTime);
      waitForTilesLoaded(hgc, done);
    });

    it('should add a heatmap', (done) => {
      // height defined in the testViewConf file, just the chromosome names
      // track
      expect(totalTrackPixelHeight(hgc.instance().state.views.aa)).to.eql(57);

      hgc.instance().handleTrackAdded('aa', horizontalHeatmapTrack, 'top');

      hgc.setState(hgc.instance().state);

      // this should show the graphics, but it initially doesn't
      // setTimeout(done, tileLoadTime);
      waitForTilesLoaded(hgc, done);
    });

    it('should change the opacity of the label', (done) => {
      hgc.instance().state.views.aa.tracks.top[0].options.labelBackgroundOpacity = 0.5;

      hgc.setState(hgc.instance().state);
      const horizontalHeatmap = getTrackObject(hgc, 'aa', 'hh1');

      expect(horizontalHeatmap.options.labelBackgroundOpacity).to.eql(0.5);

      // setTimeout(done, tileLoadTime);
      done();
    });

    it('should have a horizontal heatmap scale', (done) => {
      const horizontalHeatmap = getTrackObject(hgc, 'aa', 'hh1');

      const svg = horizontalHeatmap.exportColorBarSVG();
      const rect = svg.getElementsByClassName('color-rect')[0];

      // let svgText = new XMLSerializer().serializeToString(svg);

      done();
    });

    it('should add a large horizontal heatmap', (done) => {
      // handleTrackAdded automatically sets the height
      const prevHeight = hgc.instance().state.views.aa.layout.h;
      hgc.instance().handleTrackAdded('aa', largeHorizontalHeatmapTrack, 'top');

      hgc.setState(hgc.instance().state);

      // setTimeout(done, tileLoadTime);
      // make sure that the view has grown
      expect(hgc.instance().state.views.aa.layout.h).to.be.above(prevHeight);

      waitForTilesLoaded(hgc, done);
    });


    it('should add a few more horizontal tracks', (done) => {
      const numNewTracks = 5;
      for (let i = 0; i < numNewTracks; i++) {
        const newTrackJson = JSON.parse(JSON.stringify(largeHorizontalHeatmapTrack));
        newTrackJson.uid = slugid.nice();
        hgc.setState(hgc.instance().state);

        hgc.instance().handleTrackAdded('aa', newTrackJson, 'top');
      }

      hgc.setState(hgc.instance().state);

      // setTimeout(done, tileLoadTime);
      waitForTilesLoaded(hgc, done);
    });

    it('updates the view and deletes some tracks', (done) => {
      // hgc.update();
      const trackRendererHeight = hgc.instance().tiledPlots.aa.trackRenderer.currentProps.height;

      const numToDelete = 3;
      const toDeleteUids = [];
      for (let i = 0; i < numToDelete; i++) {
        const trackUid = hgc.instance().state.views.aa.tracks.top[i].uid;
        toDeleteUids.push(trackUid);
      }

      for (const uid of toDeleteUids) {
        hgc.instance().handleCloseTrack('aa', uid);
      }

      hgc.setState(hgc.instance().state);

      hgc.instance().tiledPlots.aa.measureSize();

      // make sure that the trackRenderer is now smaller than it was before
      // we deleted the tracks
      const newTrackRendererHeight = hgc.instance().tiledPlots.aa.trackRenderer.currentProps.height;
      expect(newTrackRendererHeight).to.be.below(trackRendererHeight);
      waitForTilesLoaded(hgc, done);
    });

    it('Adds a center heatmap track', (done) => {
      hgc.instance().handleTrackAdded('aa', heatmapTrack, 'center');

      hgc.setState(hgc.instance().state);
      hgc.instance().tiledPlots.aa.measureSize();

      // setTimeout(done, tileLoadTime);
      waitForTilesLoaded(hgc, done);
    });

    it('Checks to make sure the newly added heatmap was large enough and deletes a track', (done) => {
      const prevTrackRendererHeight = hgc.instance().tiledPlots.aa.trackRenderer.currentProps.height;
      const prevTotalHeight = hgc.instance().calculateViewDimensions(hgc.instance().state.views.aa).totalHeight;

      const newView = hgc.instance().handleCloseTrack('aa', 'hcl').aa;
      hgc.setState(hgc.instance().state);
      // hgc.instance().tiledPlots['aa'].measureSize();

      // let nextTrackRendererHeight = hgc.instance().tiledPlots['aa'].trackRenderer.currentProps.height;
      const nextTotalHeight = hgc.instance().calculateViewDimensions(newView).totalHeight;

      // expect(nextTrackRendererHeight).to.be.equal(prevTrackRendererHeight - 57);
      expect(nextTotalHeight).to.be.below(prevTotalHeight);

      // setTimeout(done, shortLoadTime);
      done();
    });

    it('Should resize the center track', (done) => {
      const view = hgc.instance().state.views.aa;
      view.layout.h += 2;

      hgc.setState(hgc.instance().state);
      hgc.instance().tiledPlots.aa.measureSize();

      // setTimeout(done, shortLoadTime);
      waitForTilesLoaded(hgc, done);
    });

    it('Should add a bottom track and have the new height', (done) => {
      const prevHeight = hgc.instance().tiledPlots.aa.trackRenderer.getTrackObject('heatmap3').dimensions[1]

      const newTrack = JSON.parse(JSON.stringify(horizontalHeatmapTrack));
      newTrack.uid = 'xyx1';

      hgc.instance().handleTrackAdded('aa', newTrack, 'bottom');
      hgc.setState(hgc.instance().state);
      hgc.instance().tiledPlots.aa.measureSize();
      // skip this test for now
      done();
      /*

      // adding a new track should not make the previous one smaller

      const newHeight = hgc.instance().tiledPlots.aa.trackRenderer.getTrackObject('heatmap3').dimensions[1]
      console.log('prevHeight:', prevHeight, 'newHeight:', newHeight);
      expect(prevHeight).to.eql(newHeight);

      waitForTilesLoaded(hgc, done);
      */
    });

    it('Should resize the center', (done) => {
      const view = hgc.instance().state.views.aa;
      view.layout.h += 2;

      hgc.setState(hgc.instance().state);
      hgc.instance().tiledPlots.aa.measureSize();

      waitForTilesLoaded(hgc, done);
    });

    it('Should delete the bottom track and not resize the center', (done) => {
      const prevSize = hgc.instance().tiledPlots.aa.trackRenderer.getTrackObject('heatmap3').dimensions[1];

      hgc.instance().handleCloseTrack('aa', 'xyx1');
      hgc.setState(hgc.instance().state);
      hgc.instance().tiledPlots.aa.measureSize();

      const nextSize = hgc.instance().tiledPlots.aa.trackRenderer.getTrackObject('heatmap3').dimensions[1];

      // expect(nextSize).to.be.eql(prevSize);

      waitForTilesLoaded(hgc, done);
    });
  });

  describe('Export SVG properly', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent
        options={{ bounded: false }}
        viewConfig={testViewConfX1}
      />, { attachTo: div });

      hgc.update();
      waitForTilesLoaded(hgc, done);
    });

    it ("Exports to SVG", (done) => {
      let svg = hgc.instance().createSVG();
      let svgText = new XMLSerializer().serializeToString(svg);

      expect(svgText.indexOf('rect')).to.be.above(0);
      // hgc.instance().handleExportSVG();
      //

      done();
    });


    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent
        options={{ bounded: false }}
        viewConfig={project1D}
      />, { attachTo: div });

      hgc.update();
      waitForTilesLoaded(hgc, done);
    });

    it ("Exports to SVG", (done) => {
      let svg = hgc.instance().createSVG();
      let svgText = new XMLSerializer().serializeToString(svg);

      //expect(svgText.indexOf('dy="-17"')).to.be.above(0);
      //hgc.instance().handleExportSVG();

      done();
    });

    it ("Replaces one of the views and tries to export again", (done) => {
      let views = hgc.instance().state.views;

      let newView = JSON.parse(JSON.stringify(views['aa']));

      hgc.instance().handleCloseView('aa');
      views = hgc.instance().state.views;

      newView.uid = 'a2';
      newView.layout.i = 'a2';

      views['a2'] = newView;

      hgc.instance().setState({views: views});

      // this used to raise an error because the hgc.instance().tiledPlots
      // would maintain a reference to the closed view and we would try
      // to export it as SVG
      hgc.instance().createSVG();

      done();

      //hgc.instance().createSVG();

    });

    it ('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent 
        options={{bounded: false}}
        viewConfig={project1D}
      />, 
        {attachTo: div});

      hgc.update();
      waitForTilesLoaded(hgc, done);
    });

    it('Exports to SVG', (done) => {
      const svg = hgc.instance().createSVG();
      const svgText = new XMLSerializer().serializeToString(svg);

      // check to make sure that the horizontal labels shifted down
      // the horizontal lines' labels should be shifted down
      expect(svgText.indexOf('dy="14"')).to.be.above(0);

      // check to make sure that chromosome tick labels are there
      expect(svgText.indexOf('chr17:40,500,000')).to.be.above(0);

      // check to make sure that the chromosome ticks are present
      expect(svgText.indexOf('line x1')).to.be.above(0);
      expect(svgText.indexOf('#777777')).to.be.above(0);

      //hgc.instance().handleExportSVG();

      done();
    });
  });

  describe('Track type menu tests', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent
        options={{ bounded: false }}
        viewConfig={oneTrackConfig}
      />, { attachTo: div });

      hgc.update();
      waitForTilesLoaded(hgc, done);

      // visual check that the heatmap track config menu is moved
      // to the left
    });

    it ("Opens the track type menu", (done) => {
      const clickPosition = {
        bottom : 85,
        height : 28,
        left : 246,
        right : 274,
        top : 57,
        width : 28,
        x : 246,
        y : 57,
      }
      const uid = 'line1';

      hgc.instance().tiledPlots.aa.handleConfigTrackMenuOpened(uid, clickPosition);
      let cftm = hgc.instance().tiledPlots.aa.configTrackMenu;

      const subMenuRect = {
        bottom : 88,
        height : 27,
        left : 250,
        right : 547.984375,
        top : 61,
        width : 297.984375,
        x : 250,
        y : 61,
      }

      const series = invalidTrackConfig.views[0].tracks.top;

      // get the object corresponding to the series
      cftm.handleItemMouseEnterWithRect(subMenuRect, series);
      let seriesObj = cftm.seriesListMenu;

      const position = {left: 127.03125, top: 84};
      const bbox = {
        bottom : 104,
        height : 20,
        left : 131.03125,
        right : 246,
        top : 84,
        width : 114.96875,
        x : 131.03125,
        y : 84,
      };

      let trackTypeItems = seriesObj.getTrackTypeItems(position, bbox, series);

      expect(trackTypeItems.props.menuItems).to.have.property('horizontal-line');
      expect(trackTypeItems.props.menuItems).to.have.property('horizontal-point');

      done();
    });

    it ("Changes the track type", (done) => {
      // make sure that this doesn't error
      hgc.instance().tiledPlots.aa.handleChangeTrackType('line1', 'horizontal-bar');

      // make sure that the uid of the top track has been changed
      expect(hgc.instance().state.views.aa.tracks.top[0].uid).to.not.eql('line1');
      expect(hgc.instance().state.views.aa.tracks.top[0].type).to.eql('horizontal-bar');

      done();
    });
  });

  describe('Check for menu clashing in the center track ', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent
        options={{ bounded: false }}
        viewConfig={simpleCenterViewConfig}
      />, { attachTo: div });

      hgc.update();
      waitForTilesLoaded(hgc, done);

      // visual check that the heatmap track config menu is moved
      // to the left
    });
  });


  describe('2D Rectangle Annotations', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent
        options={{ bounded: false }}
        viewConfig={rectangleDomains}
      />, { attachTo: div });

      hgc.update();
      waitForTilesLoaded(hgc, done);
    });

    it ("Check to make sure that the rectangles are initially small ", (done) => {
      let track = getTrackObject(hgc, 'aa', 'rectangles1');

      hasSmaller = false;
      for (let uid of Object.keys(track.drawnRects)) {
        if (track.drawnRects[uid].width <  5) {
          hasSmaller = true;
          break;
        }
      }

      expect(hasSmaller).to.eql(true);

      const views = hgc.instance().state.views;
      track = getTrackByUid(views.aa.tracks, 'rectangles1');

      track.options.minSquareSize = '8';

      hgc.setState({
        views,
      });

      waitForTilesLoaded(hgc, done);
    });

    it ("Make sure that the rectangles are large", (done) => {
      let track = getTrackObject(hgc, 'aa', 'rectangles1');

      hasSmaller = false;
      for (let uid of Object.keys(track.drawnRects)) {
        if (track.drawnRects[uid].width <  5) {
          hasSmaller = true;
          break;
        }
      }

      expect(hasSmaller).to.eql(false);

      const views = hgc.instance().state.views;
      track = getTrackByUid(views.aa.tracks, 'rectangles1');

      track.options.minSquareSize = '5';

      hgc.setState({
        views,
      });

      waitForTilesLoaded(hgc, done);
    });

    it ("Exports to SVG", (done) => {
      hgc.instance().createSVG();

      done();
    });
  });

  describe('Division track', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent
        options={{ bounded: false }}
        viewConfig={divisionViewConfig}
      />, { attachTo: div });

      hgc.update();
      waitForTilesLoaded(hgc, done);

      // visual check that the heatmap track config menu is moved
      // to the left
    });

    it ('clones itself', (done) => {
      hgc.instance().handleAddView(hgc.instance().state.views.aa);

      done();
    });
  });


  describe("Starting with no genome position search box", () => {
    it ('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(<HiGlassComponent 
        options={{bounded: false}}
        viewConfig={noGPSB}
      />, 
        {attachTo: div});

      hgc.update();
      waitForTilesLoaded(hgc, done);
    });

    it ("Makes the search box visible", (done) => {
      let assemblyPickButton = hgc.find('.assembly-pick-button');
      //expect(assemblyPickButton.length).to.eql(0);

      hgc.instance().handleTogglePositionSearchBox('aa');
      hgc.update();

      assemblyPickButton = hgc.find('.assembly-pick-button');
      //expect(assemblyPickButton.length).to.eql(1);

      waitForJsonComplete(done);
    });

    it ("Makes sure that the search box points to mm9", (done) => {
      hgc.update();
      expect(hgc.instance().genomePositionSearchBoxes['aa'].state.selectedAssembly).to.eql('mm9');

      done();
    });

    it ("Switch the selected genome to dm3", (done) => {
      hgc.instance().genomePositionSearchBoxes['aa'].handleAssemblySelect('dm3');
      hgc.update();

      waitForJsonComplete(done);
    });

    it ("Searches for the w gene", (done) => {
      // this gene previously did nothing when searching for it
      hgc.instance().genomePositionSearchBoxes['aa'].onAutocompleteChange({}, 'w');

      //setTimeout(done, tileLoadTime);
      waitForJsonComplete(done);
    });

    it ("Makes sure that no genes are loaded", (done) => {
      expect(hgc.instance().genomePositionSearchBoxes['aa'].state.genes.length).to.eql(0)

      done();
    });

    it ("Switch the selected genome to mm9", (done) => {
      hgc.instance().genomePositionSearchBoxes['aa'].handleAssemblySelect('mm9');
      hgc.update();

      waitForJsonComplete(done);
    });

    it ("Searches for the Clock gene", (done) => {
      // this gene previously did nothing when searching for it
      hgc.instance().genomePositionSearchBoxes['aa'].onAutocompleteChange({}, 'Clock');

      //setTimeout(done, tileLoadTime);
      waitForJsonComplete(done);
    });

    it ("Clicks the search positions", (done) => {
      hgc.instance().genomePositionSearchBoxes['aa'].buttonClick();

      waitForJsonComplete(() => {
        waitForTransitionsFinished(hgc, () => {
          waitForTilesLoaded(hgc, done);
        });
      });
    });

    it ("Expects the view to have changed location", (done) => {
      let zoomTransform = hgc.instance().tiledPlots['aa'].trackRenderer.zoomTransform;

      expect(zoomTransform.k - 47).to.be.below(1);
      expect(zoomTransform.x - 2224932).to.be.below(1);

      done();
    });

    it ("Checks that autocomplete fetches some genes", (done) => {
      //hgc.instance().genomePositionSearchBoxes['aa'].onAutocompleteChange({}, "t");
      //new ReactWrapper(hgc.instance().genomePositionSearchBoxes['aa'].autocompleteMenu, true).simulate('change', { value: 't'});
      //new ReactWrapper(hgc.instance().genomePositionSearchBoxes['aa'], true).setState({value: 't'});
      hgc.instance().genomePositionSearchBoxes['aa'].onAutocompleteChange({}, 'T');
      hgc.update();

      waitForJsonComplete(done);
    });

    it ("Checks the selected genes", (done) => {
      // don't use the human autocomplete id
      expect(hgc.instance().genomePositionSearchBoxes['aa'].state.autocompleteId).to.not.eql('OHJakQICQD6gTD7skx4EWA')
      expect(hgc.instance().genomePositionSearchBoxes['aa'].state.genes[0].geneName).to.eql('Gt(ROSA)26Sor');

      waitForJsonComplete(done);
    });


    it ("Switch the selected genome to hg19", (done) => {
      hgc.instance().genomePositionSearchBoxes['aa'].handleAssemblySelect('hg19');
      hgc.update();

      waitForJsonComplete(done);
    });

    it ("Sets the text to TP53", (done) => {
      hgc.instance().genomePositionSearchBoxes['aa'].onAutocompleteChange({}, 'TP53');
      hgc.update();

      waitForJsonComplete(done);
    });

    it ("Clicks on the search button", (done) => {
      hgc.instance().genomePositionSearchBoxes['aa'].buttonClick();

      waitForJsonComplete(() => {
        waitForTransitionsFinished(hgc, () => {
          waitForTilesLoaded(hgc, done);
        });
      });
    });

    it ("Expects the view to have changed location", (done) => {
      let zoomTransform = hgc.instance().tiledPlots['aa'].trackRenderer.zoomTransform;

      expect(zoomTransform.k - 234).to.be.below(1);
      expect(zoomTransform.x + 7656469).to.be.below(1);

      done();
    });


    it ("Ensures that the autocomplete has changed", (done) => {
      hgc.instance().genomePositionSearchBoxes['aa'].onAutocompleteChange({}, '');
      expect(hgc.instance().genomePositionSearchBoxes['aa'].state.autocompleteId).to.eql('OHJakQICQD6gTD7skx4EWA')

      waitForJsonComplete(done);
    });

    it ("Ensure that newly loaded genes are from hg19", (done) => {
      expect(hgc.instance().genomePositionSearchBoxes['aa'].state.genes[0].geneName).to.eql('TP53');

      done();
    });

    it ("Switches back to mm9", (done) => {
      hgc.instance().genomePositionSearchBoxes['aa'].handleAssemblySelect('mm9');
      hgc.update();

      waitForJsonComplete(done);
    });

    it ("Mock type something", (done) => {
      hgc.instance().genomePositionSearchBoxes['aa'].onAutocompleteChange({}, '');

      waitForJsonComplete(done);
    });

    it ("Make sure it has mouse genes", (done) => {
      expect(hgc.instance().genomePositionSearchBoxes['aa'].state.genes[0].geneName).to.eql('Gt(ROSA)26Sor');

      done();
    });

    it ("Switches back to hg19", (done) => {
      hgc.instance().genomePositionSearchBoxes['aa'].handleAssemblySelect('hg19');
      hgc.update();

      waitForJsonComplete(done);
    });

    it ("Makes the search box invisible", (done) => {
      expect(hgc.instance().genomePositionSearchBoxes['aa'].state.selectedAssembly).to.eql('hg19');
      hgc.instance().handleTogglePositionSearchBox('aa');
      hgc.update();

      let assemblyPickButton = hgc.find('.assembly-pick-button');
      expect(assemblyPickButton.length).to.eql(0);

      waitForJsonComplete(done);
    });

    it ("Makes the search box visible again", (done) => {
      hgc.instance().handleTogglePositionSearchBox('aa');
      hgc.update();

      waitForJsonComplete(done);
    });

    it ("Ensures that selected assembly is hg19", (done) => {
      expect(hgc.instance().genomePositionSearchBoxes['aa'].state.selectedAssembly).to.eql('hg19');

      done();
    });

    it ("checks that the div hasn't grown too much", (done) => {
      expect(div.clientHeight).to.be.below(500);

      done();
    });

  });
});
