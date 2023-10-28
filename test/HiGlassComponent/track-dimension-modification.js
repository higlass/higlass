// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import {
  mountHGComponent,
  removeHGComponent,
} from '../../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../../app/scripts/utils';

import { geneAnnotationsOnly } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Track dimension modification test', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, geneAnnotationsOnly, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
  });

  it('resizes the track', () => {
    const trackId = 'G0zF1N_5QHmgD4MMduoYFQ';
    const viewId = 'aa';
    const settings = {
      viewId,
      trackId,
      height: 100,
    };
    hgc.instance().trackDimensionsModifiedHandler(settings);

    const track = getTrackObjectFromHGC(hgc.instance(), 'aa', trackId);
    expect(track.dimensions[1]).to.equal(100);
  });
});
