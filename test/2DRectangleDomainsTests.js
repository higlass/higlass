/* eslint-env node, jasmine */
import {
  configure
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

// Utils
import { mountHGComponent, removeHGComponent } from '../app/scripts/utils';

import viewconf from './view-configs/loop-annotations';

configure({ adapter: new Adapter() });

describe('2D Rectangular Domains', () => {
  let hgc = null;
  let div = null;

  beforeAll(done => {
    [div, hgc] = mountHGComponent(div, hgc, viewconf, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true
    });
  });

  it('export rectangles in the same color that they are in the view', () => {
    const svgString = hgc.instance().createSVGString();
    expect(svgString.indexOf('cyan')).to.be.above(-1);
  });

  afterAll(() => {
    removeHGComponent(div);
  });
});
