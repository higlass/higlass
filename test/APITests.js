/* eslint-env node, jasmine */
import {
  waitForTransitionsFinished,
  waitForTilesLoaded,
  removeHGComponent,
} from '../app/scripts/utils';

import {
  simpleCenterViewConfig,
} from './view-configs';

import createElementAndApi from './utils/create-element-and-api';

describe('Simple HiGlassComponent', () => {
  let div = null;
  let api = null;

  describe('Options tests', () => {
    it('creates an editable component', () => {
      ([div, api] = createElementAndApi(simpleCenterViewConfig));

      const component = api.getComponent();

      expect(Object.keys(component.viewHeaders).length).toBeGreaterThan(0);
    });

    it('zooms to negative domain', (done) => {
      ([div, api] = createElementAndApi(simpleCenterViewConfig,
        { editable: false }));

      api.zoomTo('a', 6.069441699652629, 6.082905691828387,
        -23.27906532393644, -23.274695776773807, 100);

      waitForTransitionsFinished(api.getComponent(), () => {
        expect(api.getComponent().yScales.a.domain()[0]).toBeLessThan(0);
        done();
      });
    });

    it('zooms to just x and y', (done) => {
      ([div, api] = createElementAndApi(simpleCenterViewConfig,
        { editable: false }));

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
      ([div, api] = createElementAndApi(simpleCenterViewConfig,
        { editable: false }));

      expect(() => api.zoomTo('nonexistent', 6.069441699652629, 6.082905691828387,
        -23.274695776773807, -23.27906532393644))
        .toThrow('Invalid viewUid. Current present uuids: a');
    });

    it('creates a non editable component', () => {
      ([div, api] = createElementAndApi(simpleCenterViewConfig,
        { editable: false }));

      const component = api.getComponent();

      expect(Object.keys(component.viewHeaders).length).toEqual(0);
    });

    it('retrieves a track', () => {
      ([div, api] = createElementAndApi(simpleCenterViewConfig,
        { editable: false }));

      const viewconf = api.getViewConfig();
      const trackObj = api.getTrackObject(viewconf.views[0].tracks.center[0].uid);

      expect(trackObj).toBeDefined();
    });

    it('zooms to a negative location', (done) => {
      ([div, api] = createElementAndApi(simpleCenterViewConfig,
        { editable: false, bounded: true }));

      api.zoomTo('a', -10000000, 10000000);

      waitForTransitionsFinished(api.getComponent(), () => {
        waitForTilesLoaded(api.getComponent(), () => {
          done();
        });
      });
    });

    afterEach(() => {
      removeHGComponent(div);
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
