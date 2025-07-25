// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// Utils
import {
  waitForTilesLoaded,
  waitForTransitionsFinished,
} from '../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../app/scripts/utils';

import { topAxisOnly } from './view-configs';

import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';
import viewConfigWithoutFromViewUids from './view-configs-more/viewportProjectionsWithoutFromViewUids.json';
import viewConfig from './view-configs/viewport-projection.json';

describe('Viewport projection tests', () => {
  let api;
  let div;

  let div0;
  let api0;

  beforeEach(async () => {
    [div0, api0] = await createElementAndApi(topAxisOnly, {}, 600, 100);
    [div, api] = await createElementAndApi(viewConfig);
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

  it("Ensure that the viewport projection's borders are black", async () => {
    await new Promise((done) => {
      waitForTilesLoaded(api.getComponent(), () => {
        setTimeout(() => {
          // the idea is to make sure the borders of the viewport projection are black
          const trackObj = getTrackObjectFromHGC(
            api.getComponent(),
            'aa',
            'GWbBXmaFQTO8tia0-wljaA',
            true,
          );

          const viewportRect = trackObj.gMain.select('rect.selection');
          expect(viewportRect.attr('stroke')).to.equal('black');
          expect(viewportRect.attr('fill')).to.equal('black');

          done(null);
        }, 0);
      });
    });
  });

  it('Dispatches an empty mousewheel event on the viewport projection', async () => {
    const evt = new WheelEvent('wheel', {
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
      cancelable: true,
    });

    const trackObj = getTrackObjectFromHGC(
      api.getComponent(),
      'aa',
      'GWbBXmaFQTO8tia0-wljaA',
    );
    const ixd1 = api.getComponent().xScales.aa.domain();

    trackObj.gMain.node().dispatchEvent(evt);

    await new Promise((done) => {
      waitForTransitionsFinished(api.getComponent(), () => {
        const ixd2 = api.getComponent().xScales.aa.domain();

        // shouldn't have zoomed because deltaY = 0
        expect(ixd1[0]).to.equal(ixd2[0]);
        expect(ixd1[1]).to.equal(ixd2[1]);

        done(null);
      });
    });
  });

  it('Dispatches a mousewheel event on the viewport projection and makes sure it zooms', async () => {
    const evt = new WheelEvent('wheel', {
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
      cancelable: true,
    });

    const trackObj = getTrackObjectFromHGC(
      api.getComponent(),
      'aa',
      'GWbBXmaFQTO8tia0-wljaA',
    );
    const ixd1 = api.getComponent().xScales.aa.domain();

    trackObj.gMain.node().dispatchEvent(evt);

    await new Promise((done) => {
      waitForTransitionsFinished(api.getComponent(), () => {
        const ixd2 = api.getComponent().xScales.aa.domain();

        // shouldn't have zoomed because deltaY = 0
        expect(ixd1[0]).not.to.equal(ixd2[0]);
        expect(ixd1[1]).not.to.equal(ixd2[1]);

        done(null);
      });
    });
  });
});

describe('Viewport projection without linked views tests', () => {
  let api;
  let div;

  beforeEach(async () => {
    [div, api] = await createElementAndApi(viewConfigWithoutFromViewUids);
  });

  afterEach(() => {
    api.destroy();
    removeDiv(div);
    api = undefined;
    div = undefined;
  });

  it('Ensure that the viewport projection horizontal is rendered', async () => {
    await new Promise((done) => {
      waitForTilesLoaded(api.getComponent(), () => {
        const trackObj = getTrackObjectFromHGC(
          api.getComponent(),
          'viewport-projection-test-view',
          'viewport-projection-test-track-h',
          true,
        );

        trackObj.rerender();

        const viewportRect = trackObj.gMain.select('rect.selection');

        expect(Math.round(viewportRect.attr('y'))).to.equal(0);
        expect(Math.round(viewportRect.attr('width'))).to.equal(59);
        expect(viewportRect.attr('fill')).to.equal('#F00');

        done(null);
      });
    });
  });

  it('Ensure that the viewport projection vertical is rendered', async () => {
    await new Promise((done) => {
      waitForTilesLoaded(api.getComponent(), () => {
        const trackObj = getTrackObjectFromHGC(
          api.getComponent(),
          'viewport-projection-test-view',
          'viewport-projection-test-track-v',
          true,
        );

        trackObj.rerender();

        const viewportRect = trackObj.gMain.select('rect.selection');

        expect(Math.round(viewportRect.attr('x'))).to.equal(0);
        expect(Math.round(viewportRect.attr('height'))).to.equal(18);
        expect(viewportRect.attr('fill')).to.equal('#0F0');

        done(null);
      });
    });
  });

  it('Ensure that the viewport projection center is rendered', async () => {
    await new Promise((done) => {
      waitForTilesLoaded(api.getComponent(), () => {
        const trackObj = getTrackObjectFromHGC(
          api.getComponent(),
          'viewport-projection-test-view',
          'viewport-projection-test-track-c',
          true,
        );

        trackObj.rerender();

        const viewportRect = trackObj.gMain.select('rect.selection');

        expect(Math.round(viewportRect.attr('width'))).to.equal(59);
        expect(Math.round(viewportRect.attr('height'))).to.equal(18);
        expect(viewportRect.attr('fill')).to.equal('#00F');

        done(null);
      });
    });
  });

  it('Publishes an updated view config when the domain of the viewport projection horizontal changes', async () => {
    await new Promise((done) => {
      waitForTilesLoaded(api.getComponent(), () => {
        const trackObj = getTrackObjectFromHGC(
          api.getComponent(),
          'viewport-projection-test-view',
          'viewport-projection-test-track-h',
          true,
        );

        const oldViewConfig = api.getViewConfig();
        expect(
          Math.round(
            oldViewConfig.views[0].tracks.whole[0].projectionXDomain[0],
          ),
        ).to.equal(225681610);
        expect(
          Math.round(
            oldViewConfig.views[0].tracks.whole[0].projectionXDomain[1],
          ),
        ).to.equal(226375262);

        api.on('viewConfig', (newViewConfigString) => {
          const newViewConfig = JSON.parse(newViewConfigString);
          expect(
            Math.round(
              newViewConfig.views[0].tracks.whole[0].projectionXDomain[0],
            ),
          ).to.equal(225681615);
          expect(
            Math.round(
              newViewConfig.views[0].tracks.whole[0].projectionXDomain[1],
            ),
          ).to.equal(226375265);

          done(null);
        });

        const xDomain = [225681615, 226375265];
        const yDomain = trackObj.viewportYDomain;
        trackObj.setDomainsCallback(xDomain, yDomain);
      });
    });
  });
});
