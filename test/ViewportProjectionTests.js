/* eslint-env node, mocha */
import {
  configure,
  // render,
} from 'enzyme';

import {
  select
} from 'd3-selection';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

// Utils
import {
  mountHGComponent,
  getTrackObjectFromHGC,
  waitForTransitionsFinished,
} from '../app/scripts/utils';


configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let hgc = null;
  let div = null;

  describe('Viewport projection tests', () => {
    beforeAll((done) => {
      ([div, hgc] = mountHGComponent(div, hgc, 'http://higlass.io/api/v1/viewconfs/?d=Y7FtjugjR6OIV_P2DRqCSg',
        done));
    });

    it("Ensure that the viewport projection's borders are black", (done) => {
      // the idea is to make sure the borders of the viewport projection are black
      const viewportRect = select(hgc.instance().topDiv).select('rect.selection');

      // console.log('viewportRect', viewportRect);
      // console.log('componentDiv', viewportRect.style('color'), viewportRect.style('fill'));

      expect(viewportRect.style('color')).to.eql('rgb(51, 51, 51)');
      expect(viewportRect.style('fill')).to.eql('rgb(0, 0, 0)');

      done();
    });

    it("Dispatches an empty mousewheel event on the viewport projection", (done) => {
      var evt = new WheelEvent('wheel', {
        deltaX: 0,
        deltaY: 0,
        deltaZ: 0,
        deltaMode: 0,
        clientX: 343,
        clientY: 246,
        screenX: -1238,
        screenY: 343,
        view: window,
        bubbles: true,
        cancelable: true
      })

      const trackObj = getTrackObjectFromHGC(hgc.instance(), 
        'aa', 'GWbBXmaFQTO8tia0-wljaA');
      const ixd1 = hgc.instance().xScales.aa.domain();


      trackObj.gMain.node().dispatchEvent(evt);

      waitForTransitionsFinished(hgc.instance(), () => {
        const ixd2 = hgc.instance().xScales.aa.domain();

        // shouldn't have zoomed because deltaY = 0
        expect(ixd1[0]).to.eql(ixd2[0]);
        expect(ixd1[1]).to.eql(ixd2[1]);

        done();
      })
    });

    it("Dispatches a mousewheel event on the viewport projection and makes sure it zooms", (done) => {
      var evt = new WheelEvent('wheel', {
        deltaX: 0,
        deltaY: -4.01,
        deltaZ: 0,
        deltaMode: 0,
        clientX: 343,
        clientY: 246,
        screenX: -1238,
        screenY: 343,
        view: window,
        bubbles: true,
        cancelable: true
      })

      const trackObj = getTrackObjectFromHGC(hgc.instance(), 
        'aa', 'GWbBXmaFQTO8tia0-wljaA');
      const ixd1 = hgc.instance().xScales.aa.domain();


      trackObj.gMain.node().dispatchEvent(evt);

      waitForTransitionsFinished(hgc.instance(), () => {
        const ixd2 = hgc.instance().xScales.aa.domain();

        // shouldn't have zoomed because deltaY = 0
        expect(ixd1[0]).to.not.eql(ixd2[0]);
        expect(ixd1[1]).to.not.eql(ixd2[1]);

        done();
      })
    });

    afterAll((done) => {
      // document.body.removeChild(div);

      done();
    });
  });
});
