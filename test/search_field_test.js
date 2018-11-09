import { expect } from 'chai';
import SearchField from '../app/scripts/SearchField';
import { ChromosomeInfo } from '../app/scripts/ChromosomeInfo';

import chromInfoHg19 from './chrom_info';


describe('A search field', () => {
  // 'https://s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt'

  const searchField = new SearchField(chromInfoHg19);

  it('should search for ranges', () => {
    let range1 = null;
    let range2 = null;
    [range1, range2] = searchField.searchPosition('chr17:7566932-7595655');

    expect(range1[0]).to.be.above(2000000000);
    expect(range1[1]).to.be.above(2000000000);

    [range1, range2] = searchField.searchPosition('chr17:7566932-chr19:7595655');

    expect(range1[0]).to.be.above(2000000000);
    expect(range1[1]).to.be.above(2000000000);
  });

  it('should search for more than one chromosome', () => {
    let range1 = null; let
      range2 = null;
    [range1, range2] = searchField.searchPosition('chrX-chr22');

    [range1, range2] = searchField.searchPosition('chr1-chr2');

    expect(range1).to.eql([0, 492449994]);

    [range1, range2] = searchField.searchPosition('chr2-chr1');
    expect(range1).to.eql([0, 492449994]);

    [range1, range2] = searchField.searchPosition('chr1 & chr2');

    // expect(range1).to.eql([1, 249250621]);
    // expect(range2).to.eql([249250622,492449994]);
  });

  it('it should search within the first chromosome', () => {
    let range1 = null; let
      range2 = null;
    [range1, range2] = searchField.searchPosition('chr1:1000000-chr1:2000000');

    expect(range1).to.eql([1000000, 2000000]);

    [range1, range2] = searchField.searchPosition('chr1:2000000-chr1:3000000 & chr1:1000000-chr1:2000000');

    expect(range1).to.eql([2000000, 3000000]);
    expect(range2).to.eql([1000000, 2000000]);
  });

  it('should search for entire chromosomes', () => {
    let range1 = null; let
      range2 = null;
    [range1, range2] = searchField.searchPosition('chr1');

    expect(range1).to.eql([0, 249250621]);

    [range1, range2] = searchField.searchPosition('chr1 & chr2');

    // expect(range1).to.eql([1, 249250621]);
    // expect(range2).to.eql([249250622,492449994]);
  });
});
