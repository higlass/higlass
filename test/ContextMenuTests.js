// @ts-nocheck

import { expect } from 'chai';
import { spyOn } from 'tinyspy';

// Utils
import { getTrackRenderer } from '../app/scripts/utils';

import createElementAndApi from './utils/create-element-and-api';
import waitForElementWithText from './utils/dom';
import removeDiv from './utils/remove-div';
import viewConfig from './view-configs/two-bars-and-a-heatmap.json';

describe('Context menu tests', () => {
  let api;
  let div;

  beforeEach(() => {
    [div, api] = createElementAndApi(viewConfig);
  });

  it('Tries to open a context menu', (done) => {
    const contextmenu = new MouseEvent('contextmenu', {
      clientX: 348,
      clientY: 315,
      bubbles: true,
      view: window,
    });

    const trackRenderer = getTrackRenderer(api.getComponent(), 'aa');

    // get the heatmap object
    const trackObj = trackRenderer.getTrackObject('cc');
    const spy = spyOn(trackObj, 'contextMenuItems');
    // open up the context menu
    trackRenderer.eventTracker.dispatchEvent(contextmenu);
    // wait until it appears
    waitForElementWithText(document, 'Dekker Lab HFFc6 DpnII', (element) => {
      const me = new MouseEvent('mouseover', {
        bubbles: true,
      });

      // hover over the track's menu
      element.dispatchEvent(me);

      waitForElementWithText(document, 'Configure Series', (el1) => {
        expect(spy.called).to.be.true;

        done();
      });
    });
    8;
  });

  afterEach(() => {
    api.destroy();
    removeDiv(div);
    api = undefined;
    div = undefined;
  });
});
