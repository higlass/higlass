/* eslint-env node, jasmine */
import {
  configure,
  mount,
  // render,
  ReactWrapper,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { select } from 'd3-selection';
import React from 'react';
import ReactDOM from 'react-dom';
import slugid from 'slugid';

import HiGlassComponent from '../app/scripts/HiGlassComponent';
import HeatmapOptions from '../app/scripts/HeatmapOptions';

// Utils
import {
  scalesCenterAndK,
  totalTrackPixelHeight,
  getTrackByUid,
  getTrackObjectFromHGC,
  getTiledPlot,
  waitForJsonComplete,
  waitForTilesLoaded,
  waitForTransitionsFinished,
} from '../app/scripts/utils';

// View configs
import {
  // paperFigure1,
  osmConf,
  geneAnnotationsOnly,
  annotationsTilesView,
  horizontalAndVerticalMultivec,
  invalidTrackConfig,
  divergentTrackConfig,
  divisionViewConfig,
  simpleCenterViewConfig,
  rectangleDomains,
  threeViews,
  project1D,
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

configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let hgc = null;
  let div = null;

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

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

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('should add and resize a vertical heatmp', (done) => {
      hgc.instance().handleTrackAdded('aa', verticalHeatmapTrack, 'left');
      hgc.instance().state.views.aa.tracks.left[0].width = 100;

      hgc.setState(hgc.instance().state);
      hgc.instance().tiledPlots.aa.measureSize();

      const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'vh1');

      expect(track.originalTrack.axis.track.flipText).toEqual(true);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Should flip the vertical heatmap', () => {
      const { views } = hgc.instance().state;
      const track = getTrackByUid(views.aa.tracks, 'vh1');

      track.options.oneDHeatmapFlipped = 'yes';

      const trackObj = getTrackObjectFromHGC(hgc.instance(), 'aa', 'vh1').originalTrack;
      hgc.setState({
        views,
      });

      // make sure the heatmap was flipped
      expect(trackObj.pMain.scale.y).toBeLessThan(0);
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
      expect(totalTrackPixelHeight(hgc.instance().state.views.aa)).toEqual(57);

      hgc.instance().handleTrackAdded('aa', horizontalHeatmapTrack, 'top');

      hgc.setState(hgc.instance().state);

      // this should show the graphics, but it initially doesn't
      waitForTilesLoaded(hgc.instance(), done);
    });

    it('should change the opacity of the label', () => {
      hgc.instance().state.views.aa.tracks.top[0].options.labelBackgroundOpacity = 0.5;

      hgc.setState(hgc.instance().state);
      const horizontalHeatmap = getTrackObjectFromHGC(hgc.instance(), 'aa', 'hh1');

      expect(horizontalHeatmap.options.labelBackgroundOpacity).toEqual(0.5);
    });

    it('should have a horizontal heatmap scale', () => {
      const horizontalHeatmap = getTrackObjectFromHGC(hgc.instance(), 'aa', 'hh1');

      const svg = horizontalHeatmap.exportColorBarSVG();
      const rects = svg.getElementsByClassName('color-rect');
      expect(rects.length).toBeGreaterThan(0);

      // let svgText = new XMLSerializer().serializeToString(svg);
    });

    it('should add a large horizontal heatmap', (done) => {
      // handleTrackAdded automatically sets the height
      const prevHeight = hgc.instance().state.views.aa.layout.h;
      hgc.instance().handleTrackAdded('aa', largeHorizontalHeatmapTrack, 'top');

      hgc.setState(hgc.instance().state);

      // make sure that the view has grown
      expect(hgc.instance().state.views.aa.layout.h).toBeGreaterThan(prevHeight);

      waitForTilesLoaded(hgc.instance(), done);
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

      waitForTilesLoaded(hgc.instance(), done);
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
      expect(newTrackRendererHeight).toBeLessThan(trackRendererHeight);
      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Adds a center heatmap track', (done) => {
      hgc.instance().handleTrackAdded('aa', heatmapTrack, 'center');

      hgc.setState(hgc.instance().state);
      hgc.instance().tiledPlots.aa.measureSize();

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Checks to make sure the newly added heatmap was large enough and deletes a track', () => {
      const prevTotalHeight = hgc.instance().calculateViewDimensions(
        hgc.instance().state.views.aa
      ).totalHeight;

      const newView = hgc.instance().handleCloseTrack('aa', 'hcl').aa;
      hgc.setState(hgc.instance().state);
      // hgc.instance().tiledPlots['aa'].measureSize();

      // let nextTrackRendererHeight =
      // hgc.instance().tiledPlots['aa'].trackRenderer.currentProps.height;
      const nextTotalHeight = hgc.instance().calculateViewDimensions(newView).totalHeight;

      // expect(nextTrackRendererHeight).toEqual(prevTrackRendererHeight - 57);
      expect(nextTotalHeight).toBeLessThan(prevTotalHeight);

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
      expect(prevHeight).toEqual(newHeight);

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
      const prevSize = hgc.instance().tiledPlots.aa.trackRenderer.getTrackObject('heatmap3')
        .dimensions[1];

      hgc.instance().handleCloseTrack('aa', 'xyx1');
      hgc.setState(hgc.instance().state);
      hgc.instance().tiledPlots.aa.measureSize();

      const nextSize = hgc.instance().tiledPlots.aa.trackRenderer.getTrackObject('heatmap3')
        .dimensions[1];

      // Was commented out: Uncomment and see if it works...
      expect(nextSize).toEqual(prevSize);

      waitForTilesLoaded(hgc.instance(), done);
    });
  });

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
      waitForTilesLoaded(hgc.instance(), done);

      // visual check that the heatmap track config menu is moved
      // to the left
    });

    it('Opens the track type menu', () => {
      const clickPosition = {
        bottom: 85,
        height: 28,
        left: 246,
        right: 274,
        top: 57,
        width: 28,
        x: 246,
        y: 57,
      };
      const uid = 'line1';

      hgc.instance().tiledPlots.aa.handleConfigTrackMenuOpened(uid, clickPosition);
      const cftm = hgc.instance().tiledPlots.aa.configTrackMenu;

      const subMenuRect = {
        bottom: 88,
        height: 27,
        left: 250,
        right: 547.984375,
        top: 61,
        width: 297.984375,
        x: 250,
        y: 61,
      };

      const series = invalidTrackConfig.views[0].tracks.top;

      // get the object corresponding to the series
      cftm.handleItemMouseEnterWithRect(subMenuRect, series[0]);
      const seriesObj = cftm.seriesListMenu;

      const position = { left: 127.03125, top: 84 };
      const bbox = {
        bottom: 104,
        height: 20,
        left: 131.03125,
        right: 246,
        top: 84,
        width: 114.96875,
        x: 131.03125,
        y: 84,
      };

      const trackTypeItems = seriesObj.getTrackTypeItems(position, bbox, series);

      expect(trackTypeItems.props.menuItems['horizontal-line']).toBeUndefined();
      expect(trackTypeItems.props.menuItems['horizontal-point']).toBeUndefined();
    });

    it('Opens the close track menu', () => {
      const clickPosition = {
        bottom: 85,
        height: 28,
        left: 246,
        right: 274,
        top: 57,
        width: 28,
        x: 246,
        y: 57,
      };
      const uid = 'line1';

      hgc.instance().tiledPlots.aa.handleCloseTrackMenuOpened(uid, clickPosition);
    });
  });

  describe('API tests', () => {
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
          viewConfig={osmConf}
      />, { attachTo: div });

      hgc.update();
      waitForTilesLoaded(hgc.instance(), done);
      // done();
    });

    it('Switches to the osm tles track', () => {
      const { views } = hgc.instance().state;
      // console.log('views:', views);

      const view = views.aa;

      view.tracks.center[0].type = 'osm-2d-tile-ids';
      view.tracks.center[0].uid = 'bb';

      hgc.setState({
        views,
      });
    });
  });

  describe('API tests', () => {
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
        viewConfig={geneAnnotationsOnly}
      />, { attachTo: div });

      hgc.update();
      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Zooms to a location', (done) => {
      hgc.instance().zoomTo('aa', 1, 1000000);

      waitForTransitionsFinished(hgc.instance(), () => {
        const svgText = hgc.instance().createSVGString();

        // make sure none of the chromosome labels are left
        // over after zooming
        expect(svgText.indexOf('chr11')).toEqual(-1);

        // hgc.instance().handleExportSVG();
        done();
      });
    });

    it('Zooms a little closer', (done) => {
      hgc.instance().zoomTo('aa', 165061, 945306);

      waitForTransitionsFinished(hgc.instance(), () => {
        done();
      });
    });
  });

  describe('Gene Annotations Display', () => {
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
        viewConfig={geneAnnotationsOnly}
      />, { attachTo: div });

      hgc.update();
      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Check to make sure that the rectangles are initially small', (done) => {
      let track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'genes1');

      const { views } = hgc.instance().state;
      track = getTrackByUid(views.aa.tracks, 'genes1');

      // console.log('setting views');
      track.options.labelPosition = 'topLeft';

      hgc.setState({
        views,
      });
      // console.log('track', track);

      waitForTilesLoaded(hgc.instance(), done);
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
      waitForTilesLoaded(hgc.instance(), done);
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
      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Exports to SVG', () => {
      const svg = hgc.instance().createSVG();
      const svgText = new XMLSerializer().serializeToString(svg);

      expect(svgText.indexOf('rect')).toBeGreaterThan(0);
      // hgc.instance().handleExportSVG();
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
      waitForTilesLoaded(hgc.instance(), done);
    });

    // it('Exports to SVG', (done) => {
    //   // const svg = hgc.instance().createSVG();
    //   // const svgText = new XMLSerializer().serializeToString(svg);
    //
    //   // expect(svgText.indexOf('dy="-17"')).toBeGreaterThan(0);
    //   // hgc.instance().handleExportSVG();
    //
    //   done();
    // });

    it('Replaces one of the views and tries to export again', () => {
      let { views } = hgc.instance().state;

      const newView = JSON.parse(JSON.stringify(views.aa));

      hgc.instance().handleCloseView('aa');
      ({ views } = hgc.instance().state);

      newView.uid = 'a2';
      newView.layout.i = 'a2';

      views.a2 = newView;

      hgc.instance().setState({ views });

      // this used to raise an error because the hgc.instance().tiledPlots
      // would maintain a reference to the closed view and we would try
      // to export it as SVG
      hgc.instance().createSVG();

      // hgc.instance().createSVG();
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
      />,
      { attachTo: div });

      hgc.update();
      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Exports to SVG', () => {
      const svg = hgc.instance().createSVG();
      const svgText = new XMLSerializer().serializeToString(svg);

      // check to make sure that the horizontal labels shifted down
      // the horizontal lines' labels should be shifted down
      expect(svgText.indexOf('dy="14"')).toBeGreaterThan(0);

      // check to make sure that chromosome tick labels are there
      expect(svgText.indexOf('chr17: 40,500,000')).toBeGreaterThan(0);

      // check to make sure that the chromosome ticks are present
      expect(svgText.indexOf('line x1')).toBeGreaterThan(0);
      expect(svgText.indexOf('#808080')).toBeGreaterThan(0);

      // hgc.instance().handleExportSVG();
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
      waitForTilesLoaded(hgc.instance(), done);

      // visual check that the heatmap track config menu is moved
      // to the left
    });

    it('Opens the track type menu', () => {
      const clickPosition = {
        bottom: 85,
        height: 28,
        left: 246,
        right: 274,
        top: 57,
        width: 28,
        x: 246,
        y: 57,
      };
      const uid = 'line1';


      hgc.instance().tiledPlots.aa.handleConfigTrackMenuOpened(uid, clickPosition);
      const cftm = hgc.instance().tiledPlots.aa.configTrackMenu;


      const subMenuRect = {
        bottom: 88,
        height: 27,
        left: 250,
        right: 547.984375,
        top: 61,
        width: 297.984375,
        x: 250,
        y: 61,
      };

      const { views } = hgc.instance().state;
      const series = getTrackByUid(views.aa.tracks, 'line1');

      // get the object corresponding to the series
      cftm.handleItemMouseEnterWithRect(subMenuRect, series);
      const seriesObj = cftm.seriesListMenu;

      const position = { left: 127.03125, top: 84 };
      const bbox = {
        bottom: 104,
        height: 20,
        left: 131.03125,
        right: 246,
        top: 84,
        width: 114.96875,
        x: 131.03125,
        y: 84,
      };

      const validSeries = getTrackByUid(views.aa.tracks, 'line1');
      const trackTypeItems = seriesObj.getTrackTypeItems(position, bbox, validSeries);

      expect(trackTypeItems.props.menuItems['horizontal-line']).toBeDefined();
      expect(trackTypeItems.props.menuItems['horizontal-point']).toBeDefined();
    });

    it('Changes the track type', () => {
      // make sure that this doesn't error
      hgc.instance().tiledPlots.aa.handleChangeTrackType('line1', 'horizontal-bar');

      // make sure that the uid of the top track has been changed
      expect(hgc.instance().state.views.aa.tracks.top[0].uid).not.toEqual('line1');
      expect(hgc.instance().state.views.aa.tracks.top[0].type).toEqual('horizontal-bar');
    });
  });

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
      waitForTilesLoaded(hgc.instance(), done);
    });

    it('has a colorbar', () => {
      const heatmap = hgc.instance().tiledPlots.aa.trackRenderer
        .trackDefObjects.c1.trackObject.createdTracks.heatmap1;
      expect(heatmap.pColorbarArea.x).toBeLessThan(heatmap.dimensions[0] / 2);

      const selection = select(div).selectAll('.selection');

      // we expect a colorbar selector brush to be visible
      // in both views
      expect(selection.size()).toEqual(2);
    });

    it('hides the colorbar', () => {
      const { views } = hgc.instance().state;

      const track = getTrackByUid(views.aa.tracks, 'heatmap1');
      track.options.colorbarPosition = 'hidden';

      hgc.instance().setState({ views });

      // eslint-disable-next-line react/no-find-dom-node
      const selection = select(ReactDOM.findDOMNode(hgc.instance())).selectAll('.selection');

      // we expect a colorbar selector brush to be hidden
      // in one of the views
      expect(selection.size()).toEqual(1);

      track.options.colorbarPosition = 'topLeft';
      hgc.instance().setState({ views });
    });


    it('changes the colorbar color when the heatmap colormap is changed', () => {
      // hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);
      const newOptions = {
        colorRange: [
          'white',
          'black',
        ],
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'heatmap1', newOptions);

      // const svg = getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap1').exportSVG()[0];
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

      expect(getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1').options.valueScaling).toEqual('log');
      hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);
      expect(getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1').options.valueScaling).toEqual('linear');

      newOptions.valueScaling = 'log';
      hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

      // hgc.update();
    });

    it('exports SVG', () => {
      const svg = hgc.instance().createSVG();
      const svgText = new XMLSerializer().serializeToString(svg);

      // hgc.instance().handleExportSVG();

      // Make sure we have an axis that is offset from the origin
      // expect(svgText.indexOf('id="axis" transform="translate(390, 68)"')).toBeGreaterThan(0);

      // make sure that we have this color in the colorbar (this is part of the custard
      // color map)
      expect(svgText.indexOf('rgb(231, 104, 32)')).toBeGreaterThan(0);

      // make sure that this color, which is part of the afmhot colormap is not exported
      expect(svgText.indexOf('rgb(171, 43, 0)')).toBeLessThan(0);

      const line1 = hgc.instance().tiledPlots.aa.trackRenderer.trackDefObjects.line1.trackObject;

      const axis = line1.axis.exportAxisRightSVG(line1.valueScale, line1.dimensions[1]);
      const axisText = new XMLSerializer().serializeToString(axis);

      // hgc.instance().handleExportSVG();

      // let axis = svg.getElementById('axis');
      // make sure we have a tick mark for 200000
      expect(axisText.indexOf('1e+5')).toBeGreaterThan(0);
    });

    it('Adds a chromInfo track', (done) => {
      // this test was here to visually make sure that the HorizontalChromosomeAxis
      // was rendered after being drawn
      hgc.instance().handleTrackAdded('view2', chromInfoTrack, 'top');

      hgc.instance().tiledPlots.view2.render();
      hgc.instance().tiledPlots.view2
        .trackRenderer.syncTrackObjects(
          hgc.instance().tiledPlots.view2.positionedTracks()
        );

      // make sure that the chromInfo is displayed
      // setTimeout(() => done(), 1000);
      waitForTilesLoaded(hgc.instance(), done);
    });

    it('splits one of the views', (done) => {
      hgc.instance().handleAddView(twoViewConfig.views[0]);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('splits one of the views1', (done) => {
      hgc.instance().handleAddView(twoViewConfig.views[0]);

      waitForTilesLoaded(hgc.instance(), done);
    });
    it('splits one of the views2', (done) => {
      hgc.instance().handleAddView(twoViewConfig.views[0]);

      waitForTilesLoaded(hgc.instance(), done);
    });
    it('splits one of the views3', (done) => {
      hgc.instance().handleAddView(twoViewConfig.views[0]);

      waitForTilesLoaded(hgc.instance(), done);
    });
    it('splits one of the views3', (done) => {
      hgc.instance().handleAddView(twoViewConfig.views[0]);

      waitForTilesLoaded(hgc.instance(), done);
    });
    it('splits one of the views3', (done) => {
      hgc.instance().handleAddView(twoViewConfig.views[0]);

      waitForTilesLoaded(hgc.instance(), done);
    });
    it('splits one of the views3', (done) => {
      hgc.instance().handleAddView(twoViewConfig.views[0]);

      waitForTilesLoaded(hgc.instance(), done);
    });
    it('splits one of the views3', (done) => {
      hgc.instance().handleAddView(twoViewConfig.views[0]);

      waitForTilesLoaded(hgc.instance(), done);
    });
    it('splits one of the views3', (done) => {
      hgc.instance().handleAddView(twoViewConfig.views[0]);

      waitForTilesLoaded(hgc.instance(), done);
    });
    it('splits one of the views3', (done) => {
      hgc.instance().handleAddView(twoViewConfig.views[0]);

      waitForTilesLoaded(hgc.instance(), done);
    });
    it('splits one of the views3', (done) => {
      hgc.instance().handleAddView(twoViewConfig.views[0]);

      waitForTilesLoaded(hgc.instance(), done);
    });
    it('checks to make sure the colorbar is gone', (done) => {
      //
      const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap1');

      expect(track.pColorbarArea.visible).toEqual(false);

      waitForTilesLoaded(hgc.instance(), done);
    });
  });

  describe('Track types', () => {
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
        viewConfig={annotationsTilesView}
      />, { attachTo: div });

      hgc.update();
      waitForTilesLoaded(hgc.instance(), done);

      // visual check that the heatmap track config menu is moved
      // to the left
    });

    it('Ensures that only the gene-annotations and 1d-tiles tracks are listed', () => {
      const clickPosition = {
        bottom: 85,
        height: 28,
        left: 246,
        right: 274,
        top: 57,
        width: 28,
        x: 246,
        y: 57,
      };
      const uid = 'track1';

      hgc.instance().tiledPlots.aa.handleConfigTrackMenuOpened(uid, clickPosition);
      const cftm = hgc.instance().tiledPlots.aa.configTrackMenu;

      const subMenuRect = {
        bottom: 88,
        height: 27,
        left: 250,
        right: 547.984375,
        top: 61,
        width: 297.984375,
        x: 250,
        y: 61,
      };

      const { views } = hgc.instance().state;
      const series = getTrackByUid(views.aa.tracks, 'track1');

      // get the object corresponding to the series
      cftm.handleItemMouseEnterWithRect(subMenuRect, series);
      const seriesObj = cftm.seriesListMenu;

      const position = { left: 679.421875, top: 86 };
      const bbox = {
        x: 463.703125,
        y: 86,
        width: 124.4375,
        height: 21,
        top: 86,
        right: 588.140625,
        bottom: 107,
        left: 463.703125
      };

      const trackTypeItems = seriesObj.getTrackTypeItems(position, bbox, series);

      expect(trackTypeItems.props.menuItems['horizontal-gene-annotations']).toBeDefined();
      expect(trackTypeItems.props.menuItems['horizontal-1d-tiles']).toBeDefined();
      expect(trackTypeItems.props.menuItems['horizontal-line']).toBeUndefined();
    });
  });

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

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('locks the scales and recenters the page', (done) => {
      hgc.instance().handleValueScaleLocked('aa', 'heatmap1', 'view2', 'heatmap2');
      // const track1 = hgc.instance().tiledPlots.aa.trackRenderer.getTrackObject('heatmap1');
      // const track2 = hgc.instance().tiledPlots.view2.trackRenderer.getTrackObject('heatmap2');

      // zoom out a little bit
      hgc.instance().tiledPlots.aa.trackRenderer.setCenter(
        1799432348.8692136, 1802017603.5768778, 28874.21283197403
      );

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('exports as JSON and makes sure that the scales are locked', () => {
      const data = hgc.instance().getViewsAsString();

      expect(data.indexOf('valueScaleLocks')).toBeGreaterThanOrEqual(0);
    });

    it('Moves the brush on one view and makes sure it moves on the other', (done) => {
      const heatmap1Track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap1');

      // console.log('lvs1', heatmapTrack.limitedValueScale.domain());

      // move the brush down to limit the amount of visible data
      heatmap1Track.gColorscaleBrush.call(heatmap1Track.scaleBrush.move,
        [0, 100]);

      // console.log('lvs2', heatmapTrack.limitedValueScale.domain());

      const heatmap2Track = getTrackObjectFromHGC(hgc.instance(), 'view2', 'heatmap2');

      expect(heatmap1Track.options.scaleStartPercent)
        .toEqual(heatmap2Track.options.scaleStartPercent);
      expect(heatmap1Track.options.scaleEndPercent)
        .toEqual(heatmap2Track.options.scaleEndPercent);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Changes the value scale', (done) => {
      hgc.instance().tiledPlots.aa.trackRenderer
        .setCenter(179943234.8692136, 180201760.5768778, 2887.21283197403, true);

      waitForTilesLoaded(hgc.instance(), done);
    });

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
      // expect(zl1).toEqual(zl2);

      expect(domain1[1]).toEqual(domain2[1]);
    });

    it('unlocks the scales', (done) => {
      hgc.instance().handleUnlockValueScale('aa', 'heatmap1');

      // unlock the scales and zoom out
      hgc.instance().tiledPlots.aa.trackRenderer
        .setCenter(1799432348.8692136, 1802017603.5768778, 2887.21283197403);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('ensure that new domains are unequal and locks the combined tracks', (done) => {
      const track1 = getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap1');
      const track2 = getTrackObjectFromHGC(hgc.instance(), 'view2', 'heatmap2');

      const domain1 = track1.valueScale.domain();
      const domain2 = track2.valueScale.domain();

      expect(domain1[1]).not.toEqual(domain2[1]);

      waitForTilesLoaded(hgc.instance(), done);
    });


    it('Locks line and combined scales', (done) => {
      hgc.instance().handleValueScaleLocked('aa', 'c1', 'view2', 'c2');
      hgc.instance().handleValueScaleLocked('aa', 'line1', 'view2', 'line2');

      // lock the scales of two combined views
      hgc.instance().tiledPlots.aa.trackRenderer
        .setCenter(2268041199.8615317, 2267986087.2543955, 15.803061962127686);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('ensures that the new track domains are equal and unlock the combined tracks', (done) => {
      const track1 = getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap1');
      const track2 = getTrackObjectFromHGC(hgc.instance(), 'view2', 'heatmap2');

      const domain1 = track1.valueScale.domain();
      const domain2 = track2.valueScale.domain();

      expect(domain1[1]).toEqual(domain2[1]);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('zooms out', (done) => {
      hgc.instance().tiledPlots.aa.trackRenderer
        .setCenter(2268233532.6257076, 2268099618.396191, 1710.4168190956116);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('ensures that the domain changed', (done) => {
      const track1 = getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap1');
      const track2 = getTrackObjectFromHGC(hgc.instance(), 'view2', 'heatmap2');

      const domain1 = track1.valueScale.domain();
      const domain2 = track2.valueScale.domain();

      expect(domain1[1]).toBeLessThan(1);
      expect(domain1[1]).toEqual(domain2[1]);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Unlocks the scales and moves to a different location', (done) => {
      hgc.instance().handleUnlockValueScale('aa', 'c1');

      // unlock the scales and zoom out
      hgc.instance().tiledPlots.aa.trackRenderer
        .setCenter(1799432348.8692136, 1802017603.5768778, 2887.21283197403);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('ensures that the new track domains are not equal', () => {
      const track1 = hgc.instance().tiledPlots.aa.trackRenderer.getTrackObject('heatmap1');
      const track2 = hgc.instance().tiledPlots.view2.trackRenderer.getTrackObject('heatmap2');

      const domain1 = track1.valueScale.domain();
      const domain2 = track2.valueScale.domain();

      expect(domain1[1]).not.toEqual(domain2[1]);

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
      hgc.instance().tiledPlots.view2.trackRenderer
        .setCenter(1799508622.8021536, 1801234331.7949603, 17952.610495328903);

      hgc.instance().tiledPlots.view2
        .trackRenderer.syncTrackObjects(
          hgc.instance().tiledPlots.view2.positionedTracks()
        );
    });

    it('Replaces and displays a new track', (done) => {
      // hgc.instance().handleValueScaleLocked('aa', 'c1', 'view2', 'heatmap3');

      const track = getTrackObjectFromHGC(hgc.instance(), 'view2', 'heatmap3');

      // make sure that the newly added track is rendered
      expect(track.pMain.position.x).toBeGreaterThan(404);
      expect(track.pMain.position.x).toBeLessThan(406);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Locks the scales again (after waiting for the previous tiles to load)', () => {
      hgc.instance().handleValueScaleLocked('aa', 'c1', 'view2', 'heatmap3');
    });
  });

  //
  // wait a bit of time for the data to be loaded from the server
  describe('Two linked views', () => {
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
        viewConfig={JSON.parse(JSON.stringify(twoViewConfig))}
      />,
      { attachTo: div });

      hgc.update();
      waitForTilesLoaded(hgc.instance(), done);
    });

    it('zoom to the data extent', (done) => {
      // console.log('zooming to extent');
      hgc.instance().api.zoomToDataExtent('aa');

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('ensures both views zoomed to the data extent', () => {
      expect(hgc.instance().xScales.aa.domain()[0])
        .toEqual(hgc.instance().xScales.view2.domain()[0]);

      expect(hgc.instance().xScales.aa.domain()[1])
        .toEqual(hgc.instance().xScales.view2.domain()[1]);
    });
  });

  describe('Horizontal and vertical multivec', () => {
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
        viewConfig={horizontalAndVerticalMultivec}
      />,
      { attachTo: div });

      waitForTilesLoaded(hgc.instance(), done);
    });

    // it('renders with no errors', (done) => {
    //   done();
    // });
  });

  describe('Track Resizing', () => {
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

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Resizes one track ', (done) => {
      const tp = getTiledPlot(hgc.instance(), 'aa');

      tp.handleResizeTrack('line1', 289, 49);

      // tp.setState(tp.state);
      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Ensures that the track object was resized', (done) => {
      const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1');

      expect(track.dimensions[1]).toEqual(49);

      waitForTilesLoaded(hgc.instance(), done);
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

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('should load the initial config', () => {
      // this was to test an example from the higlass-website demo page
      // where the issue was that the genome position search box was being
      // styled with a margin-bottom of 10px, fixed by setting the style of
      // genome-position-search to specify margin-bottom app/styles/GenomePositionSearchBox.css
      expect(hgc.instance().state.views.aa.layout.h).toEqual(6);
    });

    it('should change the opacity of the first text label to 20%', (done) => {
      const newOptions = JSON.parse(JSON.stringify(testViewConfX2.views[0].tracks.top[0].options));
      newOptions.labelTextOpacity = 0.2;

      hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);
      hgc.setState(hgc.instance().state);

      expect(getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1').labelText.alpha)
        .toBeLessThan(0.21);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('should change the stroke width of the second line to 5', (done) => {
      const newOptions = JSON.parse(JSON.stringify(testViewConfX2.views[0].tracks.top[1].options));
      newOptions.lineStrokeWidth = 5;

      hgc.instance().handleTrackOptionsChanged('aa', 'line2', newOptions);
      hgc.setState(hgc.instance().state);

      expect(getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1').labelText.alpha)
        .toBeLessThan(0.21);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('should do something else', (done) => {
      waitForTilesLoaded(hgc.instance(), done);
    });
  });

  describe('1D viewport projection', () => {
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

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Should lock the location without throwing an error', (done) => {
      hgc.instance().handleLocationLockChosen('aa', 'bb');
      // the viewconf contains a location lock, we need to ignore it
      //
      const track = getTrackObjectFromHGC(hgc.instance(), 'bb', 'line2');
      expect(track.labelText.text.indexOf('hg19')).toEqual(0);

      const overlayElements = document.getElementsByClassName('overlay');

      // there should be two colorbars
      expect(overlayElements.length).toEqual(2);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Should add a vertical viewport projection', (done) => {
      hgc.instance().handleViewportProjected('bb', 'aa', 'vline1');
      // move the viewport just a little bit
      const overlayElements = document.getElementsByClassName('overlay');

      // we should have created an overlay element
      expect(overlayElements.length).toEqual(3);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Should project the viewport of view2 onto the gene annotations track', (done) => {
      hgc.instance().handleViewportProjected('bb', 'aa', 'ga1');
      hgc.instance().tiledPlots.aa.trackRenderer.setCenter(2540607259.217122,
        2541534691.921077,
        195.2581009864807);
      // move the viewport just a little bit
      //
      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Should make sure that the track labels still contain the assembly', (done) => {
      const track = getTrackObjectFromHGC(hgc.instance(), 'bb', 'line2');
      expect(track.labelText.text.indexOf('hg19')).toEqual(0);
      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Add a 2D vertical projection and move the lower track to different location', (done) => {
      hgc.instance().tiledPlots.bb.trackRenderer.setCenter(2540607259.217122,
        2541534691.921077,
        87.50166702270508);
      hgc.instance().handleViewportProjected('bb', 'aa', 'heatmap3');

      waitForTilesLoaded(hgc.instance(), done);
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

      expect(outputJSON.views[0].tracks.center[0].contents).toBeDefined();

      // should have two tracks
      expect(outputJSON.views[0].tracks.center[0].contents.length).toBeGreaterThan(1);

      waitForJsonComplete(done);
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
      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Changes the position of the brush to the top right', () => {
      const { views } = hgc.instance().state;
      views.aa.tracks.center[0].contents[0].options.colorbarPosition = 'topRight';

      hgc.instance().setState({ views });
    });


    it('Moves the brush on one of the views', () => {
      const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap1');

      const domain1 = track.limitedValueScale.domain();


      track.gColorscaleBrush.call(track.scaleBrush.move,
        [0, 100]);

      const domain2 = track.limitedValueScale.domain();

      // we don't expect the other view to change
      expect(domain1[0]).not.toEqual(domain2[0]);

      // console.log('domain1:', domain1);
      // console.log('domain2:', domain2);
    });

    it('locks the scales and recenters the page', (done) => {
      hgc.instance().handleValueScaleLocked('aa', 'heatmap1', 'view2', 'heatmap2');
      getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap1');
      getTrackObjectFromHGC(hgc.instance(), 'view2', 'heatmap2');

      // zoom out a little bit
      hgc.instance().tiledPlots.aa.trackRenderer.setCenter(
        1799432348.8692136, 1802017603.5768778, 28874.21283197403
      );

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Moves the brush on one view and makes sure it moves on the other', () => {
      const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap1');

      // console.log('lvs1', heatmapTrack.limitedValueScale.domain());

      // move the brush down to limit the amount of visible data
      track.gColorscaleBrush.call(track.scaleBrush.move,
        [0, 100]);

      // console.log('lvs2', heatmapTrack.limitedValueScale.domain());

      const heatmap2Track = getTrackObjectFromHGC(hgc.instance(), 'view2', 'heatmap2');

      expect(track.options.scaleStartPercent)
        .toEqual(heatmap2Track.options.scaleStartPercent);
      expect(track.options.scaleEndPercent)
        .toEqual(heatmap2Track.options.scaleEndPercent);
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

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Ensures that the custom color map loads properly', (done) => {
      // console.log('heatmap options:', HeatmapOptions);

      hgc.instance().tiledPlots.aa.handleConfigureTrack(
        twoViewConfig.views[0].tracks.center[0].contents[0],
        HeatmapOptions
      );

      waitForTilesLoaded(hgc.instance(), done);
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
      waitForTilesLoaded(hgc.instance(), done);
    });

    // it('Exports the views as SVG', (done) => {
    //   // hgc.instance().handleExportSVG();
    //
    //   done();
    // });
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
        const viewconfView = JSON.parse(viewconf).views[0];
        const newMidY = (viewconfView.initialYDomain[0] + viewconfView.initialYDomain[1]) / 2;

        expect(midY).toEqual(newMidY);
      });
      hgc.update();
      waitForTilesLoaded(hgc.instance(), done);

      // visual check that the heatmap track config menu is moved
      // to the left
    });

    it('Gets and sets the viewconfig', () => {
      const viewConf = hgc.instance().getViewsAsString();

      const newViews = hgc.instance().processViewConfig(JSON.parse(viewConf));
      hgc.setState({
        viewsByUid: newViews,
      });
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
      waitForTilesLoaded(hgc.instance(), done);

      // visual check that the heatmap track config menu is moved
      // to the left
    });

    it('Sets a new viewconfig', (done) => {
      const p = hgc.instance().api.setViewConfig(twoViewConfig);

      p.then(() => {
        // should only be called when all the tiles are loaded
        done();
      });
    });

    it('Zooms one of the views to the center', () => {
      hgc.instance().api.zoomToDataExtent('view2');
    });

    it('Zooms a nonexistant view to the center', () => {
      const badFn = () => hgc.instance().api.zoomToDataExtent('xxx');

      expect(badFn).toThrow();
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

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Ensures that the custom color map loads properly', (done) => {
      // console.log('heatmap options:', HeatmapOptions);

      hgc.instance().tiledPlots.aa.handleConfigureTrack(
        twoViewConfig.views[0].tracks.center[0].contents[0],
        HeatmapOptions
      );

      waitForTilesLoaded(hgc.instance(), done);
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

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Ensures that when a view is closed, the PIXI graphics are removed', (done) => {
      hgc.instance().handleCloseView('view2');

      // console.log('hgc.instance:', hgc.instance().pixiStage.children);
      // hgc.setState(hgc.instance().state);

      // console.log('checking...', hgc.instance().pixiStage.children);
      // since we removed one of the children, there should be only one left
      expect(hgc.instance().pixiStage.children.length).toEqual(1);

      waitForTilesLoaded(hgc.instance(), done);
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

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Links two views and moves to the side', (done) => {
      hgc.instance().handleLocationLockChosen('aa', 'bb');
      hgc.instance().handleZoomLockChosen('aa', 'bb');

      hgc.instance().tiledPlots.aa.trackRenderer.setCenter(
        1799508622.8021536, 1801234331.7949603, 17952.610495328903
      );
      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Checks to make sure that the two views have moved to the same place', () => {
      const aaXScale = hgc.instance().xScales.aa;
      const aaYScale = hgc.instance().yScales.aa;

      const bbXScale = hgc.instance().xScales.bb;
      const bbYScale = hgc.instance().yScales.bb;

      const [aaCenterX, aaCenterY] = scalesCenterAndK(aaXScale, aaYScale);
      const [bbCenterX, bbCenterY] = scalesCenterAndK(bbXScale, bbYScale);

      expect(aaCenterX - bbCenterX).toBeLessThan(0.001);
      expect(aaCenterY - bbCenterY).toBeLessThan(0.001);
    });

    it('Links the third view', (done) => {
      hgc.instance().handleLocationYanked('cc', 'aa');
      hgc.instance().handleZoomYanked('cc', 'aa');

      hgc.instance().handleLocationLockChosen('bb', 'cc');
      hgc.instance().handleZoomLockChosen('bb', 'cc');

      hgc.instance().tiledPlots.aa.trackRenderer.setCenter(
        1799509622.8021536, 1801244331.7949603, 17952.610495328903
      );

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Makes sure that the third view moved', (done) => {
      const aaXScale = hgc.instance().xScales.aa;
      const aaYScale = hgc.instance().yScales.aa;

      const ccXScale = hgc.instance().xScales.cc;
      const ccYScale = hgc.instance().yScales.cc;

      const [aaCenterX, aaCenterY] = scalesCenterAndK(aaXScale, aaYScale);
      const [ccCenterX, ccCenterY] = scalesCenterAndK(ccXScale, ccYScale);

      expect(aaCenterX - ccCenterX).toBeLessThan(0.001);
      expect(aaCenterY - ccCenterY).toBeLessThan(0.001);


      waitForTilesLoaded(hgc.instance(), done);
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

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('should load the initial config', (done) => {
      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Changes the axis to inner right', (done) => {
      const newOptions = {
        axisPositionHorizontal: 'right',
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

      const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1');
      const { pAxis } = track.axis;

      // we want the axis labels to be to the left of the end of the track
      expect(pAxis.position.x).toBeGreaterThan(track.position[0]);
      expect(pAxis.children[0].x).toBeLessThan(0);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Changes the axis to outside right', (done) => {
      const newOptions = {
        axisPositionHorizontal: 'outsideRight',
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

      const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1');
      const { pAxis } = track.axis;


      // we want the axis labels to be to the left of the end of the track
      expect(pAxis.position.x).toBeGreaterThan(track.position[0]);
      expect(pAxis.children[0].x).toBeGreaterThan(0);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Changes the axis to outside left', (done) => {
      const newOptions = {
        axisPositionHorizontal: 'outsideLeft',
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

      const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1');
      const { pAxis } = track.axis;

      // we want the axis labels to be to the left of the end of the track
      expect(pAxis.position.x).toEqual(track.position[0]);
      expect(pAxis.children[0].x).toBeLessThan(0);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Changes the axis to the left', (done) => {
      const newOptions = {
        axisPositionHorizontal: 'left',
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

      const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1');
      const { pAxis } = track.axis;

      // we want the axis labels to be to the left of the end of the track
      expect(pAxis.position.x).toEqual(track.position[0]);
      expect(pAxis.children[0].x).toBeGreaterThan(0);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Changes the axis to the top', (done) => {
      const newOptions = {
        axisPositionHorizontal: null,
        axisPositionVertical: 'top',
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'vline1', newOptions);

      const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'vline1').originalTrack;
      const { pAxis } = track.axis;

      // we want the axis labels to be to the left of the end of the track
      expect(pAxis.position.x).toEqual(track.position[0]);
      expect(pAxis.children[0].x).toBeGreaterThan(0);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Changes the axis to the outside top', (done) => {
      const newOptions = {
        axisPositionHorizontal: null,
        axisPositionVertical: 'outsideTop',
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'vline1', newOptions);

      const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'vline1').originalTrack;
      const { pAxis } = track.axis;

      // we want the axis labels to be to the left of the end of the track
      expect(pAxis.position.x).toEqual(track.position[0]);
      expect(pAxis.children[0].x).toBeLessThan(0);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Changes the axis to the outside bottom', (done) => {
      const newOptions = {
        axisPositionHorizontal: null,
        axisPositionVertical: 'outsideBottom',
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'vline1', newOptions);

      const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'vline1').originalTrack;
      const { pAxis } = track.axis;

      // we want the axis labels to be to the left of the end of the track
      expect(pAxis.position.x).toBeGreaterThan(track.position[0]);
      expect(pAxis.children[0].x).toBeGreaterThan(0);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Changes the axis to the bottom', (done) => {
      const newOptions = {
        axisPositionVertical: 'bottom',
      };

      hgc.instance().handleTrackOptionsChanged('aa', 'vline1', newOptions);

      const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'vline1').originalTrack;
      const { pAxis } = track.axis;

      // we want the axis labels to be to the left of the end of the track
      expect(pAxis.position.x).toBeGreaterThan(track.position[0]);
      expect(pAxis.children[0].x).toBeLessThan(0);

      waitForTilesLoaded(hgc.instance(), done);
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

      waitForTilesLoaded(hgc.instance(), done);
    });

    it("doesn't export maxWidth or filetype", () => {
      const viewString = hgc.instance().getViewsAsString();

      // expect(viewString.indexOf('1d-value-interval')).toBeGreaterThan(0);
      expect(viewString.indexOf('maxWidth')).toBeLessThan(0);
      expect(viewString.indexOf('filetype')).toBeLessThan(0);
      expect(viewString.indexOf('binsPerDimension')).toBeLessThan(0);
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
      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Makes the search box invisible', (done) => {
      hgc.instance().handleTogglePositionSearchBox('aa');

      waitForJsonComplete(done);
    });

    it('Makes the search box visible again', (done) => {
      hgc.instance().handleTogglePositionSearchBox('aa');

      waitForJsonComplete(done);
    });

    it('Searches for strings with spaces at the beginning', () => {
      const gpsb = hgc.instance().genomePositionSearchBoxes.aa;

      let [range1, range2] = gpsb.searchField.searchPosition('  chr1:1-1000 & chr1:2001-3000');

      expect(range1[0]).toEqual(1);
      expect(range1[1]).toEqual(1000);

      expect(range2[0]).toEqual(2001);
      expect(range2[1]).toEqual(3000);

      [range1, range2] = gpsb.searchField.searchPosition('chr1:1-1000 & chr1:2001-3000');

      expect(range1[0]).toEqual(1);
      expect(range1[1]).toEqual(1000);
    });

    it('Ensures that hg38 is in the list of available assemblies', () => {
      expect(
        hgc
          .instance()
          .genomePositionSearchBoxes.aa.state.availableAssemblies
          .indexOf('hg38')
      ).toBeGreaterThanOrEqual(0);
    });

    it('Selects mm9', (done) => {
      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('mm9');

      waitForJsonComplete(done);
    });

    it('Checks that mm9 was properly set and switches back to hg19', (done) => {
      hgc.update();
      const button = new ReactWrapper(
        hgc.instance().genomePositionSearchBoxes.aa.assemblyPickButton, true
      );
      expect(button.props().title).toEqual('mm9');

      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('hg19');

      waitForJsonComplete(done);
    });

    it('Checks that hg19 was properly', (done) => {
      hgc.update();
      const button = new ReactWrapper(
        hgc.instance().genomePositionSearchBoxes.aa.assemblyPickButton, true
      );
      expect(button.props().title).toEqual('hg19');

      waitForJsonComplete(done);
    });
  });

  describe('Window resizing', () => {
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

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Sends a resize event to fit the current view into the window', (done) => {
      const resizeEvent = new Event('resize');

      window.dispatchEvent(resizeEvent);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Resize the view', (done) => {
      div.setAttribute('style', 'width: 600px; height: 600px; background-color: lightgreen');
      const resizeEvent = new Event('resize');

      window.dispatchEvent(resizeEvent);

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Expect the the chosen rowHeight to be less than 24', (done) => {
      expect(hgc.instance().state.rowHeight).toBeLessThan(24);

      waitForTilesLoaded(hgc.instance(), done);
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
      waitForTilesLoaded(hgc.instance(), done);

      // visual check that the heatmap track config menu is moved
      // to the left
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
      waitForTilesLoaded(hgc.instance(), done);

      // visual check that the heatmap track config menu is moved
      // to the left
    });

    it('clones itself', () => {
      hgc.instance().handleAddView(hgc.instance().state.views.aa);
    });
  });

  describe('Cleanup', () => {
    it('Cleans up previously created instances and mounts a new component', () => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }
    });
  });
});
