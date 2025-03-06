// @ts-nocheck
import { afterEach, describe, expect, it } from 'vitest';

import { create, select } from 'd3-selection';
import { globalPubSub } from 'pub-sub-es';

import {
  waitForTilesLoaded,
  waitForTransitionsFinished,
  waitForElements,
  waitForSizeStabilization,
  waitForComponentReady,
} from '../app/scripts/test-helpers';

import {
  simple1And2dAnnotations,
  simpleCenterViewConfig,
} from './view-configs';

import emptyConf from './view-configs-more/emptyConf.json';
import adjustViewSpacingConf from './view-configs/adjust-view-spacing.json';
import simple1dHorizontalVerticalAnd2dDataTrack from './view-configs/simple-1d-horizontal-vertical-and-2d-data-track.json';
import simpleHeatmapViewConf from './view-configs/simple-heatmap.json';

import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';
// import drag from './utils/drag';

import { version as VERSION } from '../package.json';

describe('API Tests', () => {
  let api;
  let div;

  afterEach(() => {
    api.destroy();
    removeDiv(div);
    api = undefined;
    div = undefined;
  });

  describe.only('Options tests', () => {
    it('shows and hides the track chooser', async () => {
      [div, api] = await createElementAndApi(simpleCenterViewConfig);

      api.showTrackChooser();

      api.hideTrackChooser();
    });

    it('adjust view spacing', async () => {
      const options = {
        pixelPreciseMarginPadding: true,
        containingPaddingX: 0,
        containingPaddingY: 0,
        viewMarginTop: 32,
        viewMarginBottom: 6,
        viewMarginLeft: 32,
        viewMarginRight: 6,
        viewPaddingTop: 32,
        viewPaddingBottom: 6,
        viewPaddingLeft: 32,
        viewPaddingRight: 6,
      };

      [div, api] = await createElementAndApi(adjustViewSpacingConf, options);

      await waitForComponentReady(div);

      const tiledPlotEl = div.querySelector('.tiled-plot-div');
      const trackRendererEl = div.querySelector('.track-renderer-div');
      const topTrackEl = div.querySelector('.top-track-container');

      // We need to get the parent of tiledPlotDiv because margin is apparently
      // not included in the BBox width and height.
      const tiledPlotBBox = tiledPlotEl.parentNode.getBoundingClientRect();
      const trackRendererBBox = trackRendererEl.getBoundingClientRect();
      const topTrackBBox = topTrackEl.getBoundingClientRect();

      const totalViewHeight = adjustViewSpacingConf.views[0].tracks.top.reduce(
        (height, track) => height + track.height,
        0,
      );

      expect(topTrackBBox.height).to.equal(totalViewHeight);
      expect(trackRendererBBox.height).to.equal(
        totalViewHeight + options.viewPaddingTop + options.viewPaddingBottom,
      );
      expect(tiledPlotBBox.height).to.equal(
        totalViewHeight +
          options.viewPaddingTop +
          options.viewPaddingBottom +
          options.viewMarginTop +
          options.viewMarginBottom,
      );
      expect(trackRendererBBox.width).to.equal(
        topTrackBBox.width + options.viewPaddingLeft + options.viewPaddingRight,
      );

      expect(Math.round(tiledPlotBBox.width)).to.equal(
        topTrackBBox.width +
          options.viewPaddingLeft +
          options.viewPaddingRight +
          options.viewMarginLeft +
          options.viewMarginRight,
      );
    });

    it('creates a track with default options', async () => {
      [div, api] = await createElementAndApi(simpleCenterViewConfig, {
        defaultTrackOptions: {
          all: {
            showTooltip: true,
          },
        },
      });

      const newTrack = {
        filetype: 'hitile',
        datatype: 'vector',
        name: 'wgEncodeLicrHistoneLiverH3k27acMAdult8wksC57bl6StdSig.hitile',
        coordSystem: 'mm9',
        server: 'http://higlass.io/api/v1',
        tilesetUid: 'DLtSFl7jRI6m4eqbU7sCQg',
        type: 'horizontal-line',
      };

      const component = api.getComponent();
      component.handleTrackAdded('a', newTrack, 'top');

      const viewconf = component.getViewsAsJson();
      const trackConf = viewconf.views[0].tracks.top[0];

      expect(trackConf.options.showTooltip).to.equal(true);
      // expect(Object.keys(component.viewHeaders).length).to.be.greaterThan(0);
    });

    it('creates a track without default options', async () => {
      [div, api] = await createElementAndApi(simpleCenterViewConfig);

      const newTrack = {
        filetype: 'hitile',
        datatype: 'vector',
        name: 'wgEncodeLicrHistoneLiverH3k27acMAdult8wksC57bl6StdSig.hitile',
        coordSystem: 'mm9',
        server: 'http://higlass.io/api/v1',
        tilesetUid: 'DLtSFl7jRI6m4eqbU7sCQg',
        type: 'horizontal-line',
      };

      const component = api.getComponent();
      component.handleTrackAdded('a', newTrack, 'top');

      const viewconf = component.getViewsAsJson();
      const trackConf = viewconf.views[0].tracks.top[0];

      expect(trackConf.options.showTooltip).to.equal(false);
      // expect(Object.keys(component.viewHeaders).length).to.be.greaterThan(0);
    });

    it('creates an editable component', async () => {
      [div, api] = await createElementAndApi(simpleCenterViewConfig);

      const component = api.getComponent();

      expect(Object.keys(component.viewHeaders).length).to.be.greaterThan(0);
    });

    it('zooms to negative domain', async () => {
      [div, api] = await createElementAndApi(simpleCenterViewConfig, {
        editable: false,
      });

      await waitForComponentReady(div);

      api.zoomTo(
        'a',
        6.069441699652629,
        6.082905691828387,
        -23.27906532393644,
        -23.274695776773807,
        100,
      );

      await new Promise((done) =>
        waitForTransitionsFinished(api.getComponent(), done),
      );
      expect(api.getComponent().yScales.a.domain()[0]).to.be.lessThan(0);
    });

    return;

    it('zooms to just x and y', async () => {
      [div, api] = await createElementAndApi(simpleCenterViewConfig, {
        editable: false,
      });

      api.zoomTo('a', 6.069441699652629, 6.082905691828387, null, null, 100);

      await new Promise((done) =>
        waitForTransitionsFinished(api.getComponent(), done),
      );
      await new Promise((done) => waitForTilesLoaded(api.getComponent(), done));

      expect(api.getComponent().yScales.a.domain()[0]).to.be.greaterThan(2);
      const trackObj = api.getTrackObject('a', 'heatmap1');
      const rd = trackObj.getVisibleRectangleData(285, 156, 11, 11);
      expect(rd.data.length).to.equal(1);
    });

    it('zooms to the location near a MYC gene', async () => {
      [div, api] = await createElementAndApi(simpleCenterViewConfig, {
        editable: false,
      });

      api.zoomToGene('a', 'MYC', 100, 1000);
      await new Promise((done) =>
        waitForTransitionsFinished(api.getComponent(), done),
      );

      expect(api.getComponent().xScales.a.domain()[0]).to.be.closeTo(
        1480820463,
        1,
      );
    });

    it('suggest a list of genes that top match with the given keyword', async () => {
      [div, api] = await createElementAndApi(simpleCenterViewConfig, {
        editable: false,
      });

      await new Promise((done) => {
        api.suggestGene('a', 'MY', (suggestions) => {
          expect(
            suggestions.find(
              (d) => d.geneName.toLowerCase() === 'MYC'.toLowerCase(),
            ),
          ).to.not.equal(undefined);
          done(null);
        });
      });
    });

    it('reset viewport after zoom', async () => {
      [div, api] = await createElementAndApi(simpleHeatmapViewConf, {
        editable: false,
      });

      const hgc = api.getComponent();

      await new Promise((done) => waitForTilesLoaded(hgc, done));
      const initialXDomain = hgc.xScales.a.domain();

      const newXDomain = [1000000000, 2000000000];

      api.zoomTo('a', ...newXDomain, null, null, 100);

      await new Promise((done) => waitForTransitionsFinished(hgc, done));
      expect(Math.round(hgc.xScales.a.domain()[0])).to.equal(newXDomain[0]);
      expect(Math.round(hgc.xScales.a.domain()[1])).to.equal(newXDomain[1]);

      api.resetViewport('a');

      expect(Math.round(hgc.xScales.a.domain()[0])).to.equal(initialXDomain[0]);
      expect(Math.round(hgc.xScales.a.domain()[1])).to.equal(initialXDomain[1]);
    });

    it('zoom to a nonexistent view', async () => {
      // complete me, should throw an error rather than complaining
      // "Cannot read property 'copy' of undefined thrown"
      [div, api] = await createElementAndApi(simpleCenterViewConfig, {
        editable: false,
      });

      expect(() =>
        api.zoomTo(
          'nonexistent',
          6.069441699652629,
          6.082905691828387,
          -23.274695776773807,
          -23.27906532393644,
        ),
      ).to.throw('Invalid viewUid. Current uuids: a');
    });

    it('creates a non editable component', async () => {
      [div, api] = await createElementAndApi(simpleCenterViewConfig, {
        editable: false,
      });

      const component = api.getComponent();

      expect(Object.keys(component.viewHeaders).length).to.equal(0);
    });

    it('retrieves a track', async () => {
      [div, api] = await createElementAndApi(simpleCenterViewConfig, {
        editable: false,
      });

      const viewconf = api.getViewConfig();
      const trackObj = api.getTrackObject(
        viewconf.views[0].tracks.center[0].uid,
      );

      expect(trackObj).to.exist;
    });

    it('zooms to a negative location', async () => {
      [div, api] = await createElementAndApi(simpleCenterViewConfig, {
        editable: false,
        bounded: true,
      });
      api.zoomTo('a', -10000000, 10000000);
      await new Promise((done) =>
        waitForTransitionsFinished(api.getComponent(), done),
      );
      await new Promise((done) => waitForTilesLoaded(api.getComponent(), done));
    });

    it('has option getter', async () => {
      [div, api] = await createElementAndApi(simpleCenterViewConfig, {
        editable: false,
        sizeMode: 'bounded',
      });

      expect(api.option('editable')).to.equal(false);
      expect(api.option('sizeMode')).to.equal('bounded');
    });

    it('has version', async () => {
      [div, api] = await createElementAndApi(emptyConf, { editable: false });
      expect(api.version).to.equal(VERSION);
    });

    it('mousemove and zoom events work for 1D and 2D tracks', async () => {
      [div, api] = await createElementAndApi(
        simple1dHorizontalVerticalAnd2dDataTrack,
        { editable: false, bounded: true },
      );

      const createMouseEvent = (type, x, y) =>
        new MouseEvent(type, {
          view: window,
          bubbles: true,
          cancelable: true,
          // WARNING: The following property is absolutely crucial to have the
          // event being picked up by PIXI. Do not remove under any circumstances!
          // pointerType: 'mouse',
          screenX: x,
          screenY: y,
          clientX: x,
          clientY: y,
        });

      const moved = {};

      api.on('mouseMoveZoom', (event) => {
        moved[event.trackId] = true;
      });

      await new Promise((done) => waitForTilesLoaded(api.getComponent(), done));

      const tiledPlotDiv = div.querySelector('.tiled-plot-div');

      tiledPlotDiv.dispatchEvent(createMouseEvent('mousemove', 100, 45));
      tiledPlotDiv.dispatchEvent(createMouseEvent('mousemove', 60, 100));
      tiledPlotDiv.dispatchEvent(createMouseEvent('mousemove', 150, 150));

      await new Promise((done) => setTimeout(done, 0));

      expect(moved['h-line']).to.equal(true);
      expect(moved['v-line']).to.equal(true);
      expect(moved.heatmap).to.equal(true);
    });

    it('global mouse position broadcasting', async () => {
      [div, api] = await createElementAndApi(
        simple1dHorizontalVerticalAnd2dDataTrack,
        { editable: false, bounded: true },
      );

      api.setBroadcastMousePositionGlobally(true);

      let mouseMoveEvt = null;

      globalPubSub.subscribe('higlass.mouseMove', (evt) => {
        mouseMoveEvt = evt;
      });

      const createMouseEvent = (type, x, y) =>
        new MouseEvent(type, {
          view: window,
          bubbles: true,
          cancelable: true,
          // WARNING: The following property is absolutely crucial to have the
          // event being picked up by PIXI. Do not remove under any circumstances!
          // pointerType: 'mouse',
          screenX: x,
          screenY: y,
          clientX: x,
          clientY: y,
        });

      await new Promise((done) => waitForTilesLoaded(api.getComponent(), done));

      /** @type {HTMLElement} */
      const tiledPlotDiv = div.querySelector('.tiled-plot-div');
      const rect = tiledPlotDiv.getBoundingClientRect();
      tiledPlotDiv.dispatchEvent(
        createMouseEvent('mousemove', 150 + rect.left, 150 + rect.top),
      );

      await new Promise((done) => setTimeout(done, 0));

      expect(mouseMoveEvt).not.to.equal(null);
      expect(mouseMoveEvt.x).to.equal(150);
      expect(mouseMoveEvt.y).to.equal(150);
      expect(mouseMoveEvt.relTrackX).to.equal(85);
      expect(mouseMoveEvt.relTrackY).to.equal(85);
      expect(Math.round(mouseMoveEvt.dataX)).to.equal(1670179850);
      expect(Math.round(mouseMoveEvt.dataY)).to.equal(1832488682);
      expect(mouseMoveEvt.isFrom2dTrack).to.equal(true);
      expect(mouseMoveEvt.isFromVerticalTrack).to.equal(false);
      expect(mouseMoveEvt.sourceUid).to.exist;
      expect(mouseMoveEvt.noHoveredTracks).to.equal(false);

      mouseMoveEvt = null;
      api.setBroadcastMousePositionGlobally(false);
      tiledPlotDiv.dispatchEvent(
        createMouseEvent('mousemove', 150 + rect.left, 150 + rect.top),
      );

      await new Promise((done) => setTimeout(done, 0));

      expect(mouseMoveEvt).to.equal(null);
    });

    it('listens to click events', async () => {
      [div, api] = await createElementAndApi(simple1And2dAnnotations, {
        editable: false,
        bounded: true,
      });

      const canvas = div.querySelector('canvas');

      let clicked = 0;

      api.on('click', () => {
        clicked++;
      });

      const createPointerEvent = (type, x, y) =>
        new PointerEvent(type, {
          view: window,
          bubbles: true,
          cancelable: true,
          // WARNING: The following property is absolutely crucial to have the
          // event being picked up by PIXI. Do not remove under any circumstances!
          pointerType: 'mouse',
          screenX: x + 80,
          screenY: y + 80,
          clientX: x,
          clientY: y,
        });

      await new Promise((done) => waitForTilesLoaded(api.getComponent(), done));
      await new Promise((done) => setTimeout(done, 0));

      canvas.dispatchEvent(createPointerEvent('pointerdown', 100, 100));
      canvas.dispatchEvent(createPointerEvent('pointerup', 100, 100));

      await new Promise((done) => setTimeout(done, 0));

      canvas.dispatchEvent(createPointerEvent('pointerdown', 100, 200));
      canvas.dispatchEvent(createPointerEvent('pointerup', 100, 200));

      await new Promise((done) => setTimeout(done, 0));

      expect(clicked).to.equal(2);
    });

    it('has location getter', async () => {
      [div, api] = await createElementAndApi(simpleHeatmapViewConf, {
        editable: false,
      });

      const hgc = api.getComponent();

      await new Promise((done) => waitForTilesLoaded(hgc, done));

      const newXDomain = [1000000000, 2000000000];
      api.zoomTo('a', ...newXDomain, null, null, 100);

      await new Promise((done) => waitForTransitionsFinished(hgc, done));

      const location = api.getLocation();
      expect(Math.round(location.xDomain[0])).to.equal(1000000000);
      expect(Math.round(location.xDomain[1])).to.equal(2000000000);
      expect(Math.round(location.yDomain[0])).to.equal(1406779661);
      expect(Math.round(location.yDomain[1])).to.equal(1593220339);
      expect(Math.round(location.xRange[0])).to.equal(0);
      expect(Math.round(location.xRange[1])).to.equal(590);
      expect(Math.round(location.yRange[0])).to.equal(0);
      expect(Math.round(location.yRange[1])).to.equal(110);
    });

    it('triggers on viewConfig events from track resize interactions', async () => {
      [div, api] = await createElementAndApi(
        simple1dHorizontalVerticalAnd2dDataTrack,
      );
      const hgc = api.getComponent();

      await new Promise((done) => waitForTilesLoaded(hgc, done));
      const topTrackHeight = api.getViewConfig().views[0].tracks.top[0].height;
      expect(topTrackHeight).to.equal(60);

      hgc.tiledPlots.a.handleResizeTrack('h-line', 500, 100);

      await new Promise((done) => {
        api.on('viewConfig', (newViewConfigString) => {
          const newViewConfig = JSON.parse(newViewConfigString);
          const newTopTrackHeight = newViewConfig.views[0].tracks.top[0].height;
          expect(newTopTrackHeight).to.equal(100);
          done(null);
        });
      });
    });

    it('triggers on wheel events', async () => {
      [div, api] = await createElementAndApi(
        simple1dHorizontalVerticalAnd2dDataTrack,
      );
      const hgc = api.getComponent();

      await new Promise((done) => waitForTilesLoaded(hgc, done));

      const promise = new Promise((done) => {
        api.on('wheel', (e) => {
          expect(e.origEvt.clientX).to.equal(30);
          expect(e.origEvt.clientY).to.equal(40);
          done(null);
        });
      });

      const canvas = div.querySelector('canvas');
      // The wheel event that we expect to catch.
      const wheelEvent = {
        clientX: 30,
        clientY: 40,
        forwarded: true,
        target: canvas,
        nativeEvent: undefined,
        stopPropagation: () => {},
        preventDefault: () => {},
      };
      // Simulate the wheel and keyboard events.
      hgc.wheelHandler(wheelEvent);
      await promise;
    });

    it('can modify and set the viewconf', async () => {
      [div, api] = await createElementAndApi(simpleHeatmapViewConf, {
        editable: true,
      });

      const hgc = api.getComponent();

      await new Promise((done) => waitForTilesLoaded(hgc, done));

      const newConfig = JSON.parse(JSON.stringify(simpleCenterViewConfig));
      newConfig.views[0].tracks.center[0].options.name = 'Modified name';

      await new Promise((done) => {
        // Ckeck that the promise resolves
        api.setViewConfig(newConfig, true).then(() => {
          const retrievedViewConf = api.getViewConfig();
          const newName =
            retrievedViewConf.views[0].tracks.center[0].options.name;
          expect(newName).to.equal('Modified name');
          done(null);
        });
      });
    });
  });

  describe('Export SVG API tests', () => {
    it('listens to create SVG events', async () => {
      [div, api] = await createElementAndApi(simple1And2dAnnotations, {
        editable: false,
        bounded: true,
      });

      const promise = new Promise((done) => {
        api.on('createSVG', (svg) => {
          expect(svg.children.length).to.equal(2);
          done(null);
          return svg;
        });
      });

      await new Promise((done) => waitForTilesLoaded(api.getComponent(), done));
      api.exportAsSvg();
      await promise;
    });

    it('listens to create SVG events and enables manipulation of the SVG', async () => {
      [div, api] = await createElementAndApi(simple1And2dAnnotations, {
        editable: false,
        bounded: true,
      });

      api.on('createSVG', (svg) => {
        const svgSelection = select(svg);

        const g = create('svg:g');
        g.append('circle')
          .attr('cx', 10)
          .attr('cy', 10)
          .attr('r', 5)
          .attr('fill', 'blue');
        // Replace the contents of the exported SVG with the blue circle.
        svgSelection.html(g.node().innerHTML);
        return svgSelection.node();
      });

      await new Promise((done) => waitForTilesLoaded(api.getComponent(), done));

      const svgStr = api.exportAsSvg();
      const domparser = new DOMParser();
      const doc = domparser.parseFromString(svgStr, 'image/svg+xml');
      expect(doc.children.length).to.equal(1);
      expect(doc.children[0].nodeName.toLowerCase()).to.equal('svg');
      expect(doc.children[0].children.length).to.equal(1);
      expect(doc.children[0].children[0].nodeName.toLowerCase()).to.equal(
        'circle',
      );
    });
  });

  describe('Gene search events', () => {
    it('triggers on gene search events', async () => {
      [div, api] = await createElementAndApi(
        simple1dHorizontalVerticalAnd2dDataTrack,
      );
      const hgc = api.getComponent();

      await new Promise((done) => waitForTilesLoaded(hgc, done));

      const promise = new Promise((done) => {
        api.on('geneSearch', (e) => {
          expect(e.geneSymbol).to.equal('MYC');
          expect(e.centerX).to.equal(1521546687);
          done(null);
        });
      });

      // Simulate the gene search events.
      hgc.geneSearchHandler({
        geneSymbol: 'MYC',
        range: [1521542663, 1521550711],
        centerX: 1521546687,
        centerY: 1521546687,
      });

      await promise;
    });
  });
});
