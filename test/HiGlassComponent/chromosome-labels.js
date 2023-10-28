// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import {
  mountHGComponent,
  removeHGComponent,
  waitForTransitionsFinished,
} from '../../app/scripts/test-helpers';

import { geneAnnotationsOnly } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Chromosome labels', () => {
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

  it('Zooms to a location', (done) => {
    hgc.instance().zoomTo('aa', 1, 1000000);

    waitForTransitionsFinished(hgc.instance(), () => {
      const svgText = hgc.instance().createSVGString();

      // make sure none of the chromosome labels are left
      // over after zooming
      expect(svgText.indexOf('chr11')).to.equal(-1);

      // hgc.instance().handleExportSVG();
      done();
    });
  });

  it('Zooms a little closer', (done) => {
    hgc.instance().zoomTo('aa', 165061, 945306);

    waitForTransitionsFinished(hgc.instance(), () => {
      done();
    });
  });
});
