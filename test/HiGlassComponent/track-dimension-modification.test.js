// @ts-nocheck
import * as vi from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
} from '../../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../../app/scripts/utils';

import { geneAnnotationsOnly } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

vi.describe('Track dimension modification test', () => {
  let hgc = null;
  let div = null;

  vi.beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, geneAnnotationsOnly, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  vi.afterAll(() => {
    removeHGComponent(div);
  });

  vi.it('resizes the track', () => {
    const trackId = 'G0zF1N_5QHmgD4MMduoYFQ';
    const viewId = 'aa';
    const settings = {
      viewId,
      trackId,
      height: 100,
    };
    hgc.instance().trackDimensionsModifiedHandler(settings);
    const track = getTrackObjectFromHGC(hgc.instance(), 'aa', trackId);
    vi.expect(track.dimensions[1]).to.equal(100);
  });
});
