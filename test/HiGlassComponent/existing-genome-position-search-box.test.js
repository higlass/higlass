// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
  waitForJsonComplete,
} from '../../app/scripts/test-helpers';

import { onlyGPSB } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Exising genome position search box', () => {
  let hgc = null;
  let div = null;

  beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, onlyGPSB, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  afterAll(async () => {
    removeHGComponent(div);
  });

  it('Makes the search box invisible', async () => {
    hgc.instance().handleTogglePositionSearchBox('aa');
    await new Promise((done) => waitForJsonComplete(done));
  });

  it('Makes the search box visible again', async () => {
    hgc.instance().handleTogglePositionSearchBox('aa');
    await new Promise((done) => waitForJsonComplete(done));
  });

  it('Searches for strings with spaces at the beginning', () => {
    const gpsb = hgc.instance().genomePositionSearchBoxes.aa;

    let [range1, range2] = gpsb.searchField.searchPosition(
      '  chr1:1-1000 & chr1:2001-3000',
    );

    expect(range1[0]).to.equal(1);
    expect(range1[1]).to.equal(1000);

    expect(range2[0]).to.equal(2001);
    expect(range2[1]).to.equal(3000);

    [range1, range2] = gpsb.searchField.searchPosition(
      'chr1:1-1000 & chr1:2001-3000',
    );

    expect(range1[0]).to.equal(1);
    expect(range1[1]).to.equal(1000);
  });

  it('Ensures that hg38 is in the list of available assemblies', () => {
    expect(
      hgc
        .instance()
        .genomePositionSearchBoxes.aa.state.availableAssemblies.indexOf('hg38'),
    ).to.be.greaterThanOrEqual(0);
  });

  it('Selects mm9', async () => {
    hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('mm9');
    await new Promise((done) => waitForJsonComplete(done));
  });

  it('Checks that mm9 was properly set and switches back to hg19', async () => {
    hgc.update();
    const button =
      hgc.instance().genomePositionSearchBoxes.aa.assemblyPickButton;

    expect(button.value).to.equal('mm9');

    hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('hg19');
    await new Promise((done) => waitForJsonComplete(done));
  });

  it('Checks that hg19 was properly', async () => {
    hgc.update();
    const button =
      hgc.instance().genomePositionSearchBoxes.aa.assemblyPickButton;
    expect(button.value).to.equal('hg19');
    await new Promise((done) => waitForJsonComplete(done));
  });
});
