/* eslint-env node, jasmine */

// Utils
import {
  waitForTilesLoaded,
  getTrackObjectFromHGC,
  waitForTransitionsFinished,
} from '../app/scripts/utils';

import {
  topAxisOnly,
} from './view-configs';

import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';
import viewConfig from './view-configs/viewport-projection';

describe('Simple HiGlassComponent', () => {
  let api;
  let div;

  let div0;
  let api0;

  describe('Viewport projection tests', () => {
    beforeEach(() => {
      [div0, api0] = createElementAndApi(topAxisOnly, {}, 600, 100);
      [div, api] = createElementAndApi(viewConfig);
    });

    it("Ensure that the viewport projection's borders are black", (done) => {
      waitForTilesLoaded(api.getComponent(), () => {
        setTimeout(() => {
          // the idea is to make sure the borders of the viewport projection are black
          const trackObj = getTrackObjectFromHGC(
            api.getComponent(), 'aa', 'GWbBXmaFQTO8tia0-wljaA', true
          );

          const viewportRect = trackObj.gMain.select('rect.selection');

          expect(viewportRect.style('color')).toEqual('rgb(51, 51, 51)');
          expect(viewportRect.style('fill')).toEqual('rgb(0, 0, 0)');

          done();
        }, 0);
      });
    });

    it('Dispatches an empty mousewheel event on the viewport projection', (done) => {
      const evt = new WheelEvent('wheel',
        {
          deltaX: 0,
          deltaY: 0,
          deltaZ: 0,
          deltaMode: 0,
          clientX: 262,
          clientY: 572,
          screenX: 284,
          screenY: 696,
          view: window,
          bubbles: true,
          cancelable: true
        });

      const trackObj = getTrackObjectFromHGC(
        api.getComponent(),
        'aa',
        'GWbBXmaFQTO8tia0-wljaA'
      );
      const ixd1 = api.getComponent().xScales.aa.domain();


      trackObj.gMain.node().dispatchEvent(evt);

      waitForTransitionsFinished(api.getComponent(), () => {
        const ixd2 = api.getComponent().xScales.aa.domain();

        // shouldn't have zoomed because deltaY = 0
        expect(ixd1[0]).toEqual(ixd2[0]);
        expect(ixd1[1]).toEqual(ixd2[1]);

        done();
      });
    });

    it('Dispatches a mousewheel event on the viewport projection and makes sure it zooms', (done) => {
      const evt = new WheelEvent('wheel',
        {
          deltaX: 0,
          deltaY: -4.01,
          deltaZ: 0,
          deltaMode: 0,
          clientX: 262,
          clientY: 572,
          screenX: 284,
          screenY: 696,
          view: window,
          bubbles: true,
          cancelable: true
        });

      const trackObj = getTrackObjectFromHGC(
        api.getComponent(),
        'aa',
        'GWbBXmaFQTO8tia0-wljaA'
      );
      const ixd1 = api.getComponent().xScales.aa.domain();


      trackObj.gMain.node().dispatchEvent(evt);

      waitForTransitionsFinished(api.getComponent(), () => {
        const ixd2 = api.getComponent().xScales.aa.domain();

        // shouldn't have zoomed because deltaY = 0
        expect(ixd1[0]).not.toEqual(ixd2[0]);
        expect(ixd1[1]).not.toEqual(ixd2[1]);

        done();
      });
    });

    afterEach(() => {
      api.destroy();
      removeDiv(div);
      api = undefined;
      div = undefined;

      api0.destroy();
      removeDiv(div0);
      api0 = undefined;
      div0 = undefined;
    });
  });
});
