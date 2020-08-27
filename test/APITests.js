/* eslint-env node, jasmine */
import { globalPubSub } from 'pub-sub-es';
import { select, create } from 'd3-selection';

import {
  some,
  waitForTransitionsFinished,
  waitForTilesLoaded,
} from '../app/scripts/utils';

import {
  simpleCenterViewConfig,
  simple1And2dAnnotations,
  stackedTopTracks,
  stackedTopViews,
} from './view-configs';

import emptyConf from './view-configs-more/emptyConf';

import simpleHeatmapViewConf from './view-configs/simple-heatmap';
import adjustViewSpacingConf from './view-configs/adjust-view-spacing';
import simple1dHorizontalVerticalAnd2dDataTrack from './view-configs/simple-1d-horizontal-vertical-and-2d-data-track';

import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';
import drag from './utils/drag';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

function findCanvas(element) {
  if (element.tagName.toLowerCase() === 'canvas') return element;
  let canvas;
  some((childElement) => {
    const el = findCanvas(childElement);
    if (el) {
      canvas = el;
      return true;
    }
    return false;
  })(element.children);
  return canvas;
}

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

describe('API Tests', () => {
  let div = null;
  let api = null;

  describe('Options tests', () => {
    it('adjust view spacing', () => {
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

      [div, api] = createElementAndApi(adjustViewSpacingConf, options);

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

      expect(topTrackBBox.height).toEqual(totalViewHeight);
      expect(trackRendererBBox.height).toEqual(
        totalViewHeight + options.viewPaddingTop + options.viewPaddingBottom,
      );
      expect(tiledPlotBBox.height).toEqual(
        totalViewHeight +
          options.viewPaddingTop +
          options.viewPaddingBottom +
          options.viewMarginTop +
          options.viewMarginBottom,
      );
      expect(trackRendererBBox.width).toEqual(
        topTrackBBox.width + options.viewPaddingLeft + options.viewPaddingRight,
      );
      expect(tiledPlotBBox.width).toEqual(
        topTrackBBox.width +
          options.viewPaddingLeft +
          options.viewPaddingRight +
          options.viewMarginLeft +
          options.viewMarginRight,
      );
    });

    it('shows linear-labels as available track', () => {
      [div, api] = createElementAndApi(simpleCenterViewConfig);

      api.showAvailableTrackPositions({
        server: 'http://higlass.io/api/v1',
        tilesetUid: 'WtBJUYawQzS9M2WVIIHnlA',
        datatype: 'yyyyy',
        defaultTracks: ['xxxxx'],
      });

      // we don't know what type of track 'xxxx' is and what
      // datatype 'yyyy' is so let's not show any overlays
      selection = select(div).selectAll('.DragListeningDiv');
      expect(selection.size()).toEqual(0);

      api.showAvailableTrackPositions({
        server: 'http://higlass.io/api/v1',
        tilesetUid: 'WtBJUYawQzS9M2WVIIHnlA',
        datatype: 'linear-labels',
      });

      // before providing default tracks, higlass shouldn't know
      // which tracks are compatible with this datatype and shouldn't
      // display any drag listening divs
      let selection = select(div).selectAll('.DragListeningDiv');
      expect(selection.size()).toEqual(0);

      api.showAvailableTrackPositions({
        server: 'http://higlass.io/api/v1',
        tilesetUid: 'WtBJUYawQzS9M2WVIIHnlA',
        datatype: 'linear-labels',
        defaultTracks: ['heatmap', 'horizontal-heatmap'],
      });

      selection = select(div).selectAll('.DragListeningDiv');
      expect(selection.size()).toEqual(5);
    });

    it('creates a track with default options', () => {
      [div, api] = createElementAndApi(simpleCenterViewConfig, {
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

      expect(trackConf.options.showTooltip).toEqual(true);
      // expect(Object.keys(component.viewHeaders).length).toBeGreaterThan(0);
    });

    it('creates a track without default options', () => {
      [div, api] = createElementAndApi(simpleCenterViewConfig);

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

      expect(trackConf.options.showTooltip).toEqual(false);
      // expect(Object.keys(component.viewHeaders).length).toBeGreaterThan(0);
    });

    it('creates an editable component', () => {
      [div, api] = createElementAndApi(simpleCenterViewConfig);

      const component = api.getComponent();

      expect(Object.keys(component.viewHeaders).length).toBeGreaterThan(0);
    });

    it('zooms to negative domain', (done) => {
      [div, api] = createElementAndApi(simpleCenterViewConfig, {
        editable: false,
      });

      api.zoomTo(
        'a',
        6.069441699652629,
        6.082905691828387,
        -23.27906532393644,
        -23.274695776773807,
        100,
      );

      waitForTransitionsFinished(api.getComponent(), () => {
        expect(api.getComponent().yScales.a.domain()[0]).toBeLessThan(0);
        done();
      });
    });

    it('zooms to just x and y', (done) => {
      [div, api] = createElementAndApi(simpleCenterViewConfig, {
        editable: false,
      });

      api.zoomTo('a', 6.069441699652629, 6.082905691828387, null, null, 100);

      waitForTransitionsFinished(api.getComponent(), () => {
        waitForTilesLoaded(api.getComponent(), () => {
          expect(api.getComponent().yScales.a.domain()[0]).toBeGreaterThan(2);

          const trackObj = api.getTrackObject('a', 'heatmap1');

          const rd = trackObj.getVisibleRectangleData(285, 156, 11, 11);
          expect(rd.data.length).toEqual(1);

          done();
        });
      });
    });

    it('reset viewport after zoom', (done) => {
      [div, api] = createElementAndApi(simpleHeatmapViewConf, {
        editable: false,
      });

      const hgc = api.getComponent();

      waitForTilesLoaded(hgc, () => {
        const initialXDomain = hgc.xScales.a.domain();

        const newXDomain = [1000000000, 2000000000];

        api.zoomTo('a', ...newXDomain, null, null, 100);

        waitForTransitionsFinished(hgc, () => {
          expect(Math.round(hgc.xScales.a.domain()[0])).toEqual(newXDomain[0]);
          expect(Math.round(hgc.xScales.a.domain()[1])).toEqual(newXDomain[1]);

          api.resetViewport('a');

          expect(Math.round(hgc.xScales.a.domain()[0])).toEqual(
            initialXDomain[0],
          );
          expect(Math.round(hgc.xScales.a.domain()[1])).toEqual(
            initialXDomain[1],
          );

          done();
        });
      });
    });

    it('zoom to a nonexistent view', () => {
      // complete me, should throw an error rather than complaining
      // "Cannot read property 'copy' of undefined thrown"
      [div, api] = createElementAndApi(simpleCenterViewConfig, {
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
      ).toThrowError('Invalid viewUid. Current uuids: a');
    });

    it('creates a non editable component', () => {
      [div, api] = createElementAndApi(simpleCenterViewConfig, {
        editable: false,
      });

      const component = api.getComponent();

      expect(Object.keys(component.viewHeaders).length).toEqual(0);
    });

    it('retrieves a track', () => {
      [div, api] = createElementAndApi(simpleCenterViewConfig, {
        editable: false,
      });

      const viewconf = api.getViewConfig();
      const trackObj = api.getTrackObject(
        viewconf.views[0].tracks.center[0].uid,
      );

      expect(trackObj).toBeDefined();
    });

    it('zooms to a negative location', (done) => {
      [div, api] = createElementAndApi(simpleCenterViewConfig, {
        editable: false,
        bounded: true,
      });

      api.zoomTo('a', -10000000, 10000000);

      waitForTransitionsFinished(api.getComponent(), () => {
        waitForTilesLoaded(api.getComponent(), () => {
          done();
        });
      });
    });

    it('has option getter', () => {
      [div, api] = createElementAndApi(simpleCenterViewConfig, {
        editable: false,
        sizeMode: 'bounded',
      });

      expect(api.option('editable')).toEqual(false);
      expect(api.option('sizeMode')).toEqual('bounded');
    });

    it('overflow when in overflow mode but cannot scroll', (done) => {
      [div, api] = createElementAndApi(
        stackedTopTracks,
        { editable: false, sizeMode: 'overflow' },
        600,
        200,
        true,
      );

      expect(api.option('sizeMode')).toEqual('overflow');

      const hgContainer = div.querySelector('.higlass');
      const hgContainerStyles = window.getComputedStyle(hgContainer);
      const scrollContainer = div.querySelector('.higlass-scroll-container');
      const scrollContainerStyles = window.getComputedStyle(scrollContainer);

      expect(hgContainerStyles.getPropertyValue('position')).toEqual(
        'absolute',
      );
      expect(scrollContainerStyles.getPropertyValue('position')).toEqual(
        'absolute',
      );
      expect(scrollContainerStyles.getPropertyValue('overflow')).toEqual(
        'hidden',
      );

      const hgc = api.getComponent();

      waitForTilesLoaded(hgc, () => {
        expect(hgc.isZoomFixed('aa')).toBeFalsy();

        scrollContainer.scrollTop = 20;

        setTimeout(() => {
          expect(hgc.pixiStage.y).toEqual(0);
          done();
        }, 50);
      });
    });

    it('can scroll in scroll mode', (done) => {
      [div, api] = createElementAndApi(
        stackedTopTracks,
        { editable: false, sizeMode: 'scroll' },
        600,
        200,
        true,
      );

      expect(api.option('sizeMode')).toEqual('scroll');

      const scrollContainer = div.querySelector('.higlass-scroll-container');
      const scrollContainerStyles = window.getComputedStyle(scrollContainer);

      expect(scrollContainerStyles.getPropertyValue('overflow-x')).toEqual(
        'hidden',
      );
      expect(scrollContainerStyles.getPropertyValue('overflow-y')).toEqual(
        'auto',
      );

      const hgc = api.getComponent();

      waitForTilesLoaded(hgc, () => {
        expect(hgc.isZoomFixed('aa')).toEqual(true);

        scrollContainer.scrollTop = 20;

        setTimeout(() => {
          expect(scrollContainer.scrollTop).toEqual(20);
          expect(hgc.pixiStage.y).toEqual(-20);
          done();
        }, 50);
      });
    });

    it('remembers scroll position when switching from scroll to overflow mode', (done) => {
      [div, api] = createElementAndApi(
        stackedTopTracks,
        { editable: false, sizeMode: 'scroll' },
        600,
        200,
        true,
      );

      expect(api.option('sizeMode')).toEqual('scroll');

      const hgc = api.getComponent();

      waitForTilesLoaded(hgc, () => {
        const scrollContainer = div.querySelector('.higlass-scroll-container');
        let scrollContainerStyles = window.getComputedStyle(scrollContainer);
        scrollContainer.scrollTop = 20;

        setTimeout(() => {
          expect(hgc.pixiStage.y).toEqual(-20);
          expect(scrollContainerStyles.getPropertyValue('overflow-x')).toEqual(
            'hidden',
          );
          expect(scrollContainerStyles.getPropertyValue('overflow-y')).toEqual(
            'auto',
          );

          api.option('sizeMode', 'overflow');
          scrollContainerStyles = window.getComputedStyle(scrollContainer);

          setTimeout(() => {
            scrollContainer.scrollTop = 40;
            setTimeout(() => {
              expect(
                scrollContainerStyles.getPropertyValue('overflow'),
              ).toEqual('hidden');
              expect(hgc.pixiStage.y).toEqual(-20);
              done();
            }, 50);
          }, 250);
        }, 50);
      });
    });

    it('can scroll multiple views', (done) => {
      [div, api] = createElementAndApi(
        stackedTopViews,
        {
          editable: false,
          sizeMode: 'scroll',
        },
        600,
        200,
        true,
      );

      expect(api.option('sizeMode')).toEqual('scroll');

      const hgc = api.getComponent();

      waitForTilesLoaded(hgc, () => {
        const scrollContainer = div.querySelector('.higlass-scroll-container');
        scrollContainer.scrollTop = 20;

        setTimeout(() => {
          expect(hgc.pixiStage.y).toEqual(-20);
          done();
        }, 50);
      });
    });

    it('can pan&zoom after having scrolled', (done) => {
      [div, api] = createElementAndApi(
        stackedTopViews,
        {
          editable: false,
          sizeMode: 'scroll',
        },
        600,
        400,
        true,
      );

      expect(api.option('sizeMode')).toEqual('scroll');

      const hgc = api.getComponent();

      waitForTilesLoaded(hgc, () => {
        expect(hgc.isZoomFixed('l')).toEqual(true);

        const scrollContainer = div.querySelector('.higlass-scroll-container');
        // Scroll to the very end
        scrollContainer.scrollTop = 1790;

        setTimeout(() => {
          expect(hgc.pixiStage.y).toEqual(-1790);

          api.option('sizeMode', 'overflow');

          setTimeout(() => {
            expect(hgc.isZoomFixed('l')).toBeFalsy();

            // Trigger a pan event
            const [dx] = drag(150, 300, 140, 300, 'l', hgc);

            expect(dx).toEqual(-10);
            done();
          }, 250);
        }, 150);
      });
    });

    it('has version', () => {
      [div, api] = createElementAndApi(emptyConf, { editable: false });

      expect(api.version).toEqual(VERSION);
    });

    it('mousemove and zoom events work for 1D and 2D tracks', (done) => {
      [div, api] = createElementAndApi(
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

      waitForTilesLoaded(api.getComponent(), () => {
        const tiledPlotDiv = div.querySelector('.tiled-plot-div');

        tiledPlotDiv.dispatchEvent(createMouseEvent('mousemove', 100, 45));
        tiledPlotDiv.dispatchEvent(createMouseEvent('mousemove', 60, 100));
        tiledPlotDiv.dispatchEvent(createMouseEvent('mousemove', 150, 150));

        setTimeout(() => {
          expect(moved['h-line']).toEqual(true);
          expect(moved['v-line']).toEqual(true);
          expect(moved.heatmap).toEqual(true);
          done();
        }, 0);
      });
    });

    it('global mouse position broadcasting', (done) => {
      [div, api] = createElementAndApi(
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

      waitForTilesLoaded(api.getComponent(), () => {
        const tiledPlotDiv = div.querySelector('.tiled-plot-div');

        tiledPlotDiv.dispatchEvent(createMouseEvent('mousemove', 150, 150));

        setTimeout(() => {
          expect(mouseMoveEvt).not.toEqual(null);
          expect(mouseMoveEvt.x).toEqual(150);
          expect(mouseMoveEvt.y).toEqual(150);
          expect(mouseMoveEvt.relTrackX).toEqual(85);
          expect(mouseMoveEvt.relTrackY).toEqual(85);
          expect(Math.round(mouseMoveEvt.dataX)).toEqual(1670179850);
          expect(Math.round(mouseMoveEvt.dataY)).toEqual(1832488682);
          expect(mouseMoveEvt.isFrom2dTrack).toEqual(true);
          expect(mouseMoveEvt.isFromVerticalTrack).toEqual(false);
          expect(mouseMoveEvt.sourceUid).toBeDefined();
          expect(mouseMoveEvt.noHoveredTracks).toEqual(false);

          mouseMoveEvt = null;
          api.setBroadcastMousePositionGlobally(false);
          tiledPlotDiv.dispatchEvent(createMouseEvent('mousemove', 150, 150));

          setTimeout(() => {
            expect(mouseMoveEvt).toEqual(null);
            done();
          }, 0);
        }, 0);
      });
    });

    it('APIs are independent', () => {
      [div, api] = createElementAndApi(simpleCenterViewConfig, {
        editable: false,
        bounded: true,
      });

      /* Turning this test off because it periodically
       * and inexplicablye fails
       */
      /*
      [div, api] = createElementAndApi(
        simpleCenterViewConfig, { editable: false, bounded: true }
      );

      const [div2, api2] = createElementAndApi(
        simpleCenterViewConfig, { editable: false, bounded: true }
      );

      setTimeout(() => {
        expect(api).not.toEqual(api2);

        const hgc = api.getComponent();
        const hgc2 = api2.getComponent();

        let counter = 0;
        let counter2 = 0;

        api.on('rangeSelection', () => { ++counter; });
        api2.on('rangeSelection', () => { ++counter2; });

        hgc.apiPublish('rangeSelection', 'a');
        hgc.apiPublish('rangeSelection', 'a');

        expect(counter).toEqual(2);
        expect(counter2).toEqual(0);

        hgc2.apiPublish('rangeSelection', 'b');

        expect(counter).toEqual(2);
        expect(counter2).toEqual(1);

        let moved = false;
        let moved2 = false;

        const createMouseEvent = (type, x, y) => new MouseEvent(type, {
          view: window,
          bubbles: true,
          cancelable: true,
          // WARNING: The following property is absolutely crucial to have the
          // event being picked up by PIXI. Do not remove under any circumstances!
          // pointerType: 'mouse',
          screenX: x,
          screenY: y,
          clientX: x,
          clientY: y
        });

        api.on('mouseMoveZoom', () => { moved = true; });
        api2.on('mouseMoveZoom', () => { moved2 = true; });

        waitForTilesLoaded(api.getComponent(), () => {
          setTimeout(() => {
            div
              .querySelector('.center-track')
              .dispatchEvent(createMouseEvent('mousemove', 330, 230));

            setTimeout(() => {
              expect(moved).toEqual(true);
              expect(moved2).toEqual(false);

              setTimeout(() => {
                div2
                  .querySelector('.center-track')
                  .dispatchEvent(createMouseEvent('mousemove', 330, 730));

                setTimeout(() => {
                  expect(moved2).toEqual(true);

                  setTimeout(() => {
                    api2.destroy();

                    setTimeout(() => {
                      removeDiv(div2);

                      setTimeout(() => {
                        done();
                      }, 0);
                    }, 0);
                  }, 0);
                }, 0);
              }, 0);
            }, 0);
          }, 0);
        }, 0);
      });
      */
    });

    // Fritz: This test fails but if you comment out all the other tests it will
    // succeed!? Also, if you move this test to the top it will succeed but
    // tests number 3, 4, and 6 will fail all of a sudden! Therefore, I assume
    // the test itself work just fine but there's something fundamentally broken
    // with our test setup or with HG. Either way, the HG instances must have
    // some shared state that influences each other. I am giving up for now but
    // we need to look into this again.
    it('listens to click events', (done) => {
      [div, api] = createElementAndApi(simple1And2dAnnotations, {
        editable: false,
        bounded: true,
      });

      const canvas = findCanvas(div);

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

      waitForTilesLoaded(api.getComponent(), () => {
        setTimeout(() => {
          canvas.dispatchEvent(createPointerEvent('pointerdown', 100, 100));
          canvas.dispatchEvent(createPointerEvent('pointerup', 100, 100));

          setTimeout(() => {
            canvas.dispatchEvent(createPointerEvent('pointerdown', 100, 200));
            canvas.dispatchEvent(createPointerEvent('pointerup', 100, 200));
          }, 0);

          setTimeout(() => {
            expect(clicked).toEqual(2);

            done();
          }, 0);
        }, 0);
      });
    });

    it('has location getter', (done) => {
      [div, api] = createElementAndApi(simpleHeatmapViewConf, {
        editable: false,
      });

      const hgc = api.getComponent();

      waitForTilesLoaded(hgc, () => {
        const newXDomain = [1000000000, 2000000000];
        api.zoomTo('a', ...newXDomain, null, null, 100);

        waitForTransitionsFinished(hgc, () => {
          const location = api.getLocation();
          expect(Math.round(location.xDomain[0])).toEqual(1000000000);
          expect(Math.round(location.xDomain[1])).toEqual(2000000000);
          expect(Math.round(location.yDomain[0])).toEqual(1406779661);
          expect(Math.round(location.yDomain[1])).toEqual(1593220339);
          expect(Math.round(location.xRange[0])).toEqual(0);
          expect(Math.round(location.xRange[1])).toEqual(590);
          expect(Math.round(location.yRange[0])).toEqual(0);
          expect(Math.round(location.yRange[1])).toEqual(110);

          done();
        });
      });
    });

    it('triggers on viewConfig events from track resize interactions', (done) => {
      [div, api] = createElementAndApi(
        simple1dHorizontalVerticalAnd2dDataTrack,
      );
      const hgc = api.getComponent();
      waitForTilesLoaded(hgc, () => {
        const topTrackHeight = api.getViewConfig().views[0].tracks.top[0]
          .height;
        expect(topTrackHeight).toEqual(60);

        hgc.tiledPlots.a.handleResizeTrack('h-line', 500, 100);

        api.on('viewConfig', (newViewConfigString) => {
          const newViewConfig = JSON.parse(newViewConfigString);
          const newTopTrackHeight = newViewConfig.views[0].tracks.top[0].height;
          expect(newTopTrackHeight).toEqual(100);
          done();
        });
      });
    });

    it('triggers on wheel events', (done) => {
      [div, api] = createElementAndApi(
        simple1dHorizontalVerticalAnd2dDataTrack,
      );
      const hgc = api.getComponent();
      waitForTilesLoaded(hgc, () => {
        api.on('wheel', (e) => {
          expect(e.origEvt.clientX).toEqual(30);
          expect(e.origEvt.clientY).toEqual(40);
          done();
        });

        const canvas = findCanvas(div);
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
      });
    });

    it('can modify and set the viewconf', (done) => {
      [div, api] = createElementAndApi(simpleHeatmapViewConf, {
        editable: true,
      });

      const hgc = api.getComponent();

      waitForTilesLoaded(hgc, () => {
        const newConfig = JSON.parse(JSON.stringify(simpleCenterViewConfig));
        newConfig.views[0].tracks.center[0].options.name = 'Modified name';

        // Ckeck that the promise resolves
        api.setViewConfig(newConfig, true).then(() => {
          const retrievedViewConf = api.getViewConfig();
          const newName =
            retrievedViewConf.views[0].tracks.center[0].options.name;
          expect(newName).toEqual('Modified name');
          done();
        });
      });
    });

    afterEach(() => {
      api.destroy();
      removeDiv(div);
      api = undefined;
      div = undefined;
    });

    // it('creates a new component with different options and checks'
    //   + 'whether the global options object of the first object has changed', () => {
    //   // create one div and set an auth header
    //   const div = global.document.createElement('div');
    //   global.document.body.appendChild(div);

    //   const api = viewer(div, simpleCenterViewConfig, { a: 'x' });

    //   api.setViewConfig(simpleCenterViewConfig);
    //   api.setAuthHeader('blah');

    //   // create a second component and set a different auth header
    //   const div1 = global.document.createElement('div');
    //   global.document.body.appendChild(div1);

    //   const api1 = viewer(div1, simpleCenterViewConfig, { a: 'y' });
    //   api1.setAuthHeader('wha');

    //   // check to make sure that the two components have different
    //   // auth headers
    // });
  });

  describe('Export SVG API tests', () => {
    it('listens to create SVG events', (done) => {
      [div, api] = createElementAndApi(simple1And2dAnnotations, {
        editable: false,
        bounded: true,
      });

      api.on('createSVG', (svg) => {
        expect(svg.children.length).toEqual(2);
        done();
        return svg;
      });

      waitForTilesLoaded(api.getComponent(), () => {
        api.exportAsSvg();
      });
    });

    it('listens to create SVG events and enables manipulation of the SVG', (done) => {
      [div, api] = createElementAndApi(simple1And2dAnnotations, {
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

      waitForTilesLoaded(api.getComponent(), () => {
        const svgStr = api.exportAsSvg();

        const domparser = new DOMParser();
        const doc = domparser.parseFromString(svgStr, 'image/svg+xml');

        expect(doc.children.length).toEqual(1);
        expect(doc.children[0].nodeName.toLowerCase()).toEqual('svg');
        expect(doc.children[0].children.length).toEqual(1);
        expect(doc.children[0].children[0].nodeName.toLowerCase()).toEqual(
          'circle',
        );
        done();
      });
    });

    afterEach(() => {
      api.destroy();
      removeDiv(div);
      api = undefined;
      div = undefined;
    });
  });

  describe('Gene search events', () => {
    it('triggers on gene search events', (done) => {
      [div, api] = createElementAndApi(
        simple1dHorizontalVerticalAnd2dDataTrack,
      );
      const hgc = api.getComponent();
      waitForTilesLoaded(hgc, () => {
        api.on('geneSearch', (e) => {
          expect(e.geneSymbol).toEqual('MYC');
          expect(e.centerX).toEqual(1521546687);
          done();
        });

        // The gene search event that we expect to catch.
        const geneSearchEvent = {
          geneSymbol: 'MYC',
          range: [1521542663, 1521550711],
          centerX: 1521546687,
          centerY: 1521546687,
        };
        // Simulate the gene search events.
        hgc.geneSearchHandler(geneSearchEvent);
      });
    });
    afterEach(() => {
      api.destroy();
      removeDiv(div);
      api = undefined;
      div = undefined;
    });
  });
});
