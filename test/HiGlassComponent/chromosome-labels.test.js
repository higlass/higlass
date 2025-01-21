// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponent,
  mountHGComponentAsync,
  removeHGComponent,
  waitForTransitionsFinished,
} from '../../app/scripts/test-helpers';

import { geneAnnotationsOnly } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Chromosome labels', () => {
  let hgc = null;
  let div = null;

  beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, geneAnnotationsOnly, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  afterAll(() => {
    removeHGComponent(div);
  });

  it('Zooms to a location', async () => {
    hgc.instance().zoomTo('aa', 1, 1000000);
    await new Promise((done) =>
      waitForTransitionsFinished(hgc.instance(), done),
    );
    const svgText = hgc.instance().createSVGString();
    expect(svgText.indexOf('chr11')).to.equal(-1);
  });

  it('Zooms a little closer', async () => {
    hgc.instance().zoomTo('aa', 165061, 945306);
    await new Promise((done) =>
      waitForTransitionsFinished(hgc.instance(), done),
    );
  });
});
