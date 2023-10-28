// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import {
  mountHGComponent,
  removeHGComponent,
} from '../../app/scripts/test-helpers';

import { simpleCenterViewConfig, twoViewConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('View positioning', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, simpleCenterViewConfig, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });

    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
  });

  it('Sets a new viewconfig', (done) => {
    const p = hgc.instance().api.setViewConfig(twoViewConfig);

    p.then(() => {
      // should only be called when all the tiles are loaded
      done();
    });
  });

  it('Zooms one of the views to the center', () => {
    hgc.instance().api.zoomToDataExtent('view2');
  });

  it('Zooms a nonexistant view to the center', () => {
    const badFn = () => hgc.instance().api.zoomToDataExtent('xxx');

    expect(badFn).to.throw;
  });
});
