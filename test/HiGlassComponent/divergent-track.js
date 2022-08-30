/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import { mountHGComponent, removeHGComponent } from '../../app/scripts/utils';

import { divergentTrackConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Divergent tracks', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, divergentTrackConfig, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
  });

  it('Check that there are green and red rects', (done) => {
    const svg = hgc.instance().createSVG();

    const svgText = new XMLSerializer().serializeToString(svg);
    expect(
      svgText.indexOf('fill="green" stroke="green" x="11.24963759567723"'),
    ).to.be.greaterThan(0);
    expect(
      svgText.indexOf('fill="red" stroke="red" x="29.818754489548308"'),
    ).to.be.greaterThan(0);

    done();
  });
});
