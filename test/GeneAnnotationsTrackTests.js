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
import { waitForTilesLoaded } from '../app/scripts/utils';

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

  beforeAll(() => {
    [div, api] = createElementAndApi(geneAnnotationsOnly);
  });

  it('click on a gene', () => {
    let clicked = 0;

    api.on('click', data => {
      expect(clicked).to.eql(0);
      clicked += 1;
    });

    waitForTilesLoaded(api.getComponent(), () => {
      const canvasElem = div.querySelector('canvas');
      const loc = {
        clientX: 283.164,
        clientY: 114.683,
        screenX: 411.164,
        screenY: 216.683
      };

      canvasElem.dispatchEvent(createPointerEvent('pointerdown', loc));
      canvasElem.dispatchEvent(createPointerEvent('pointerup', loc));

      expect(clicked).to.eql(1);
      // add your tests here
    });
  });

  afterAll(() => {
    // removeHGComponent(div);
  });
});
