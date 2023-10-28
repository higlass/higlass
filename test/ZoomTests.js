// @ts-nocheck
/* eslint-env mocha */
import { spyOn } from 'tinyspy';
import { expect } from 'chai';

// Utils
import { getTrackRenderer } from '../app/scripts/utils';

import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';
import viewConfig from './view-configs/two-bars-and-a-heatmap.json';

describe('Zoom tests', () => {
  let api;
  let div;

  beforeEach(() => {
    [div, api] = createElementAndApi(viewConfig);
  });

  const doMouseMove = (startX, startY, valueScaleZooming) => {
    // simulate a zoom drag event by doing a
    // mousedown, mousemove and mouseup
    const evtDown = new MouseEvent('mousedown', {
      clientX: startX,
      clientY: startY,
      view: window,
    });

    const evtMove = new MouseEvent('mousemove', {
      clientX: startX + 2,
      clientY: startY + 2,
      view: window,
    });

    const evtUp = new MouseEvent('mouseup', {
      clientX: startX + 2,
      clientY: startY + 2,
      view: window,
    });

    const trackRenderer = getTrackRenderer(api.getComponent(), 'aa');
    trackRenderer.valueScaleZooming = valueScaleZooming;

    const spiedTrackRenderer = spyOn(trackRenderer, 'valueScaleMove');
    const prevTransform = trackRenderer.zoomTransform;

    trackRenderer.element.dispatchEvent(evtDown);
    trackRenderer.element.dispatchEvent(evtMove);
    trackRenderer.element.dispatchEvent(evtUp);

    const newTransform = trackRenderer.zoomTransform;

    const dx = newTransform.x - prevTransform.x;
    const dy = newTransform.y - prevTransform.y;

    return [dx, dy, spiedTrackRenderer];
  };

  it('Dispatches a mousewheel event on the horizontal track', (done) => {
    // eslint-disable-next-line no-unused-vars
    const [dx, dy, _] = doMouseMove(345, 221);

    expect(dy).to.equal(0);
    expect(dx).to.equal(2);

    done();
  });

  it('Dispatches a mousewheel event on the horizontal track while vauleScaleZooming', (done) => {
    const [dx, dy, spiedTrackRenderer] = doMouseMove(345, 221, true);

    expect(dy).to.equal(0);
    expect(dx).to.equal(2);
    expect(spiedTrackRenderer.called).to.be.true;
    done();
  });

  it('Dispatches a mousewheel event on the center', (done) => {
    // eslint-disable-next-line no-unused-vars
    const [dx, dy, _] = doMouseMove(348, 315);

    expect(dy).to.equal(2);
    expect(dx).to.equal(2);

    done();
  });

  it('Dispatches a mousewheel event on the left track', (done) => {
    // eslint-disable-next-line no-unused-vars
    const [dx, dy, _] = doMouseMove(56, 315);

    expect(dy).to.equal(2);
    expect(dx).to.equal(0);

    done();
  });

  afterEach(() => {
    api.destroy();
    removeDiv(div);
    api = undefined;
    div = undefined;
  });
});
