// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import { geneAnnotationsOnly } from './view-configs';
import createElementAndApi from './utils/create-element-and-api';

// Utils
import { waitForTilesLoaded } from '../app/scripts/test-helpers';
import {
  getTrackConfFromHGC,
  getTrackObjectFromHGC,
} from '../app/scripts/utils';

import removeDiv from './utils/remove-div';

Enzyme.configure({ adapter: new Adapter() });

// const createPointerEvent = (type, coords) => {
//   const params = {
//     view: window,
//     bubbles: true,
//     cancelable: true,
//     // WARNING: The following property is absolutely crucial to have the
//     // event being picked up by PIXI. Do not remove under any circumstances!
//     pointerType: 'mouse',
//     ...coords,
//   };

//   return new PointerEvent(type, params);
// };

describe('Gene Annotations Tracks', () => {
  let div = null;
  let api = null;
  let hgc = null;

  before(() => {
    [div, api] = createElementAndApi(geneAnnotationsOnly);
    hgc = api.getComponent();
  });

  // it('clicks on a gene', done => {
  //   let clicked = 0;

  //   try {
  //     api.on('click', () => {
  //       expect(clicked).to.eql(0);
  //       clicked += 1;
  //     });

  //     waitForTilesLoaded(api.getComponent(), () => {
  //       const canvasElem = div.querySelector('canvas');
  //       const loc = {
  //         clientX: 237,
  //         clientY: 117,
  //         screenX: 278,
  //         screenY: 231,
  //       };

  //       canvasElem.dispatchEvent(createPointerEvent('pointerdown', loc));
  //       canvasElem.dispatchEvent(createPointerEvent('pointerup', loc));

  //       // use a small timeout to make sure the event queue is cleared
  //       setTimeout(() => {
  //         expect(clicked).to.eql(1);

  //         done();
  //       }, 1);
  //     });
  //   } catch (e) {
  //     console.warn(e);
  //   }
  // });

  it('changes the color of the minus strand', (done) => {
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
      hgc.handleTrackOptionsChanged('aa', 'genes1', options);
      expect(trackObj.allTexts[0].text.style.fill).to.eql('#000000');

      done();
    });
  });

  it('changes the height of the gene annotations', (done) => {
    const viewUid = 'aa';
    const trackUid = 'genes1';

    const trackObj = getTrackObjectFromHGC(hgc, viewUid, trackUid);
    waitForTilesLoaded(hgc, () => {
      const tile = trackObj.fetchedTiles['16.27677'];

      // benchmark for the initial height this is half of the arrowhead
      // so it should be half the default height of 16
      expect(tile.allRects[0][0][3] - tile.allRects[0][0][1]).to.eql(8);

      const trackConf = getTrackConfFromHGC(hgc, viewUid, trackUid);
      const options = trackConf.options;

      options.geneAnnotationHeight = 32;

      // benchmark for the height after changing the options
      hgc.handleTrackOptionsChanged('aa', 'genes1', options);
      expect(tile.allRects[0][0][3] - tile.allRects[0][0][1]).to.eql(16);

      done();
    });
  });

  it('exports to SVG', () => {
    const svgStr = hgc.createSVGString();

    expect(svgStr.indexOf('path')).to.be.above(0);
    expect(svgStr.indexOf('text')).to.be.above(0);
  });

  after(() => {
    api.destroy();
    removeDiv(div);
    api = undefined;
    div = undefined;
  });
});
