// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import {
  mountHGComponent,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/test-helpers';

import { twoViewConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Close view', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, twoViewConfig, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
  });

  it('Ensures that when a view is closed, the PIXI graphics are removed', (done) => {
    hgc.instance().handleCloseView('view2');

    // console.log('hgc.instance:', hgc.instance().pixiStage.children);
    // hgc.setState(hgc.instance().state);

    // console.log('checking...', hgc.instance().pixiStage.children);
    // since we removed one of the children, there should be only one left
    expect(hgc.instance().pixiStage.children.length).to.equal(1);

    waitForTilesLoaded(hgc.instance(), done);
  });
});
