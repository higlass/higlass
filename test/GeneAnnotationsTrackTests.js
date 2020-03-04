/* eslint-env node, jasmine */
import {
  configure
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';
import { geneAnnotationsOnly } from './view-configs';

import createElementAndApi from './utils/create-element-and-api';

// Utils
import {
  waitForTilesLoaded,
  getTrackConfFromHGC,
  getTrackObjectFromHGC
} from '../app/scripts/utils';

configure({ adapter: new Adapter() });

const createPointerEvent = (type, coords) => {
  const params = {
    view: window,
    bubbles: true,
    cancelable: true,
    // WARNING: The following property is absolutely crucial to have the
    // event being picked up by PIXI. Do not remove under any circumstances!
    pointerType: 'mouse',
    ...coords
  };

  return new PointerEvent(type, params);
};

describe('Gene Annotations Tracks', () => {
  let div = null;
  let api = null;
  let hgc = null;

  beforeAll(() => {
    [div, api] = createElementAndApi(geneAnnotationsOnly);
    hgc = api.getComponent();
  });

  it('clicks on a gene', () => {
    let clicked = 0;

    api.on('click', data => {
      expect(clicked).to.eql(0);
      clicked += 1;
    });

    waitForTilesLoaded(api.getComponent(), () => {
      const canvasElem = div.querySelector('canvas');
      const loc = {
        clientX: 237,
        clientY: 117,
        screenX: 278,
        screenY: 231
      };

      canvasElem.dispatchEvent(createPointerEvent('pointerdown', loc));
      canvasElem.dispatchEvent(createPointerEvent('pointerup', loc));

      expect(clicked).to.eql(1);
      // add your tests here
    });
  });

  it('changes the color of the minus strand', () => {
    const viewUid = 'aa';
    const trackUid = 'genes1';

    const trackObj = getTrackObjectFromHGC(hgc, viewUid, trackUid);
    waitForTilesLoaded(hgc, () => {
      // make sure the gene is red
      expect(trackObj.allTexts[0].text.style.fill).to.eql('#ff0000');

      const trackConf = getTrackConfFromHGC(hgc, viewUid, trackUid);
      const options = trackConf.options;

      // set minus strand genes to black
      options.minusStrandColor = 'black';
      // const trackConfig = getTrackByUid;
      hgc.handleTrackOptionsChanged('aa', 'genes1', options);
      expect(trackObj.allTexts[0].text.style.fill).to.eql('#000000');
    });
  });

  afterAll(() => {
    // hgc.instance().handleTrackOptionsChanged('v', 'heatmap0', newOptions0);
    // removeHGComponent(div);
  });
});
