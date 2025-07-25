// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponent,
  mountHGComponentAsync,
  removeHGComponent,
  waitForTilesLoaded,
} from '../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../app/scripts/utils';
import { getTrackRenderer } from '../app/scripts/utils';

import { testViewConfX2 } from './view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Track addition and removal', () => {
  let hgc = null;
  let div = null;

  beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, testViewConfX2, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: false,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  afterAll(() => {
    removeHGComponent(div);
  });

  it('Check that collapsing the track ', async () => {
    hgc.instance().tiledPlots.aa.handleCollapseTrack('line1');
    const trackRenderer = getTrackRenderer(hgc.instance(), 'aa');

    expect(trackRenderer.trackDefObjects.line1.trackDef.height).to.eql(10);

    hgc.instance().tiledPlots.aa.handleExpandTrack('line1');
    expect(trackRenderer.trackDefObjects.line1.trackDef.height).to.not.eql(10);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
});
