// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/test-helpers';

import { twoViewConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Close view', () => {
  let hgc = null;
  let div = null;

  beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, twoViewConfig, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  afterAll(() => {
    removeHGComponent(div);
  });

  it('Ensures that when a view is closed, the PIXI graphics are removed', async () => {
    hgc.instance().handleCloseView('view2');
    // since we removed one of the children, there should be only one left
    expect(hgc.instance().pixiStage.children.length).to.equal(1);
    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
});
