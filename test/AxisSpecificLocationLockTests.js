// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import Ajv from 'ajv';

import {
  mountHGComponent,
  removeHGComponent,
  waitForTransitionsFinished,
} from '../app/scripts/test-helpers';

import schema from '../app/schema.json';
import viewconf from './view-configs/axis-specific-location-locks.json';

Enzyme.configure({ adapter: new Adapter() });
// jasmine.VAL = 30000;

describe('Axis-specific location locks', () => {
  let hgc;
  let div;

  beforeEach(async () => {
    await new Promise((resolve) => {
      [div, hgc] = mountHGComponent(div, hgc, viewconf, resolve, {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true,
      });
    });
  });

  after(async () => {
    removeHGComponent(div);
  });

  const simulateMouseDrag = (viewUid, startX, startY) => {
    // simulate a zoom drag event by doing a mousedown, mousemove, and mouseup
    const evtDown = new MouseEvent('mousedown', {
      clientX: startX,
      clientY: startY,
      view: window,
    });

    const evtMove = new MouseEvent('mousemove', {
      clientX: startX + 10,
      clientY: startY + 10,
      view: window,
    });

    const evtUp = new MouseEvent('mouseup', {
      clientX: startX + 10,
      clientY: startY + 10,
      view: window,
    });

    [evtDown, evtMove, evtUp].forEach((evt) => {
      hgc
        .instance()
        .tiledPlots[viewUid].trackRenderer.element.dispatchEvent(evt);
    });
  };

  it('Validates ViewConfig', (done) => {
    const validate = new Ajv().compile(schema);
    const valid = validate(viewconf);
    expect(valid).eql(true);
    done();
  });

  it('Dispatches a click-and-drag event on a view', (done) => {
    // The initial scales of two axes of three views
    const view1XDomain = hgc.instance().xScales['view-1'].domain();
    const view1YDomain = hgc.instance().yScales['view-1'].domain();
    const view2XDomain = hgc.instance().xScales['view-2'].domain();
    const view2YDomain = hgc.instance().yScales['view-2'].domain();
    const view3XDomain = hgc.instance().xScales['view-3'].domain();
    const view3YDomain = hgc.instance().yScales['view-3'].domain();

    simulateMouseDrag('view-1', 100, 100);

    waitForTransitionsFinished(hgc.instance(), () => {
      const newView1XDomain = hgc.instance().xScales['view-1'].domain();
      const newView1YDomain = hgc.instance().yScales['view-1'].domain();
      const newView2XDomain = hgc.instance().xScales['view-2'].domain();
      const newView2YDomain = hgc.instance().yScales['view-2'].domain();
      const newView3XDomain = hgc.instance().xScales['view-3'].domain();
      const newView3YDomain = hgc.instance().yScales['view-3'].domain();

      // locations of x and y axes of view-1 are changed directly by mouse drag
      expect(newView1XDomain[0]).not.closeTo(view1XDomain[0], 0.1);
      expect(newView1XDomain[1]).not.closeTo(view1XDomain[1], 0.1);
      expect(newView1YDomain[0]).not.closeTo(view1YDomain[0], 0.1);
      expect(newView1YDomain[1]).not.closeTo(view1YDomain[1], 0.1);

      // view-1 and view-2 are not linked, so mouse drag should be not affected on view-2
      expect(newView2XDomain[0]).closeTo(view2XDomain[0], 0.1);
      expect(newView2XDomain[1]).closeTo(view2XDomain[1], 0.1);
      expect(newView2YDomain[0]).closeTo(view2YDomain[0], 0.1);
      expect(newView2YDomain[1]).closeTo(view2YDomain[1], 0.1);

      // x-axis of view-1 is linked with x-axis of view-3, so only the x-axis domain should be changed
      expect(newView3XDomain[0]).not.closeTo(view3XDomain[0], 0.1);
      expect(newView3XDomain[1]).not.closeTo(view3XDomain[1], 0.1);
      expect(newView3YDomain[0]).closeTo(view3YDomain[0], 0.1);
      expect(newView3YDomain[1]).closeTo(view3YDomain[1], 0.1);

      done();
    });
  });
});
