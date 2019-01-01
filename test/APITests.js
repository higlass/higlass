/* eslint-env node, jasmine */
import {
  some,
  waitForTransitionsFinished,
  waitForTilesLoaded,
} from '../app/scripts/utils';

import {
  emptyConf,
  simpleCenterViewConfig,
  simple1And2dAnnotations,
} from './view-configs';

import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';

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

describe('Simple HiGlassComponent', () => {
  let div = null;
  let api = null;

  describe('Options tests', () => {
    it('creates a track with default options', () => {
      [div, api] = createElementAndApi(simpleCenterViewConfig,
        {
          defaultTrackOptions: {
            all: {
              showTooltip: true,
            }
          }
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

      expect(trackConf.options.showTooltip).toEqual(undefined);
      // expect(Object.keys(component.viewHeaders).length).toBeGreaterThan(0);
    });

    it('creates an editable component', () => {
      [div, api] = createElementAndApi(simpleCenterViewConfig);

      const component = api.getComponent();

      expect(Object.keys(component.viewHeaders).length).toBeGreaterThan(0);
    });

    it('zooms to negative domain', (done) => {
      [div, api] = createElementAndApi(
        simpleCenterViewConfig, { editable: false }
      );

      api.zoomTo('a', 6.069441699652629, 6.082905691828387,
        -23.27906532393644, -23.274695776773807, 100);

      waitForTransitionsFinished(api.getComponent(), () => {
        expect(api.getComponent().yScales.a.domain()[0]).toBeLessThan(0);
        done();
      });
    });

    it('zooms to just x and y', (done) => {
      [div, api] = createElementAndApi(
        simpleCenterViewConfig, { editable: false }
      );

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

    it('zoom to a nonexistent view', () => {
      // complete me, should throw an error rather than complaining
      // "Cannot read property 'copy' of undefined thrown"
      [div, api] = createElementAndApi(
        simpleCenterViewConfig, { editable: false }
      );

      expect(() => api.zoomTo('nonexistent', 6.069441699652629, 6.082905691828387,
        -23.274695776773807, -23.27906532393644))
        .toThrowError('Invalid viewUid. Current uuids: a');
    });

    it('creates a non editable component', () => {
      [div, api] = createElementAndApi(
        simpleCenterViewConfig, { editable: false }
      );

      const component = api.getComponent();

      expect(Object.keys(component.viewHeaders).length).toEqual(0);
    });

    it('retrieves a track', () => {
      [div, api] = createElementAndApi(
        simpleCenterViewConfig, { editable: false }
      );

      const viewconf = api.getViewConfig();
      const trackObj = api.getTrackObject(viewconf.views[0].tracks.center[0].uid);

      expect(trackObj).toBeDefined();
    });

    it('zooms to a negative location', (done) => {
      [div, api] = createElementAndApi(
        simpleCenterViewConfig, { editable: false, bounded: true }
      );

      api.zoomTo('a', -10000000, 10000000);

      waitForTransitionsFinished(api.getComponent(), () => {
        waitForTilesLoaded(api.getComponent(), () => {
          done();
        });
      });
    });

    it('has version', (done) => {
      [div, api] = createElementAndApi(emptyConf, { editable: false });

      expect(api.version).toEqual(VERSION);

      done();
    });

    it('APIs are independent', (done) => {
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
    });

    // Fritz: This test fails but if you comment out all the other tests it will
    // succeed!? Also, if you move this test to the top it will succeed but
    // tests number 3, 4, and 6 will fail all of a sudden! Therefore, I assume
    // the test itself work just fine but there's something fundamentally broken
    // with our test setup or with HG. Either way, the HG instances must have
    // some shared state that influences each other. I am giving up for now but
    // we need to look into this again.
    it('listens to click events', (done) => {
      [div, api] = createElementAndApi(
        simple1And2dAnnotations, { editable: false, bounded: true }
      );

      const canvas = findCanvas(div);

      let clicked = 0;

      api.on('click', () => { clicked++; });

      const createPointerEvent = (type, x, y) => new PointerEvent(type, {
        view: window,
        bubbles: true,
        cancelable: true,
        // WARNING: The following property is absolutely crucial to have the
        // event being picked up by PIXI. Do not remove under any circumstances!
        pointerType: 'mouse',
        screenX: x + 80,
        screenY: y + 80,
        clientX: x,
        clientY: y
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
});
