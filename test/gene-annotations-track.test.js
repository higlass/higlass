// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import createElementAndApi from './utils/create-element-and-api';
import { geneAnnotationsOnly } from './view-configs';

// Utils
import { waitForTilesLoaded } from '../app/scripts/test-helpers';
import {
  getTrackConfFromHGC,
  getTrackObjectFromHGC,
} from '../app/scripts/utils';

import removeDiv from './utils/remove-div';

Enzyme.configure({ adapter: new Adapter() });

describe('Gene Annotations Tracks', () => {
  let div = null;
  let api = null;
  let hgc = null;

  beforeAll(() => {
    [div, api] = createElementAndApi(geneAnnotationsOnly);
    hgc = api.getComponent();
  });

  afterAll(() => {
    api.destroy();
    removeDiv(div);
    api = undefined;
    div = undefined;
  });

  it('changes the color of the minus strand', async () => {
    const viewUid = 'aa';
    const trackUid = 'genes1';

    const trackObj = getTrackObjectFromHGC(hgc, viewUid, trackUid);

    await new Promise((done) => {
      waitForTilesLoaded(hgc, () => {
        // make sure the gene is red
        expect(trackObj.allTexts[0].text.style.fill).to.eql('#ff0000');

        const trackConf = getTrackConfFromHGC(hgc, viewUid, trackUid);
        const options = trackConf.options;

        // set minus strand genes to black
        options.minusStrandColor = 'black';
        hgc.handleTrackOptionsChanged('aa', 'genes1', options);
        expect(trackObj.allTexts[0].text.style.fill).to.eql('#000000');

        done(null);
      });
    });
  });

  it('changes the height of the gene annotations', async () => {
    const viewUid = 'aa';
    const trackUid = 'genes1';

    const trackObj = getTrackObjectFromHGC(hgc, viewUid, trackUid);

    await new Promise((done) => {
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

        done(null);
      });
    });
  });

  it('exports to SVG', () => {
    const svgStr = hgc.createSVGString();

    expect(svgStr.indexOf('path')).to.be.above(0);
    expect(svgStr.indexOf('text')).to.be.above(0);
  });
});
