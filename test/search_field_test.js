// @ts-nocheck
/* eslint-env mocha */
import { expect } from 'chai';
import SearchField from '../app/scripts/SearchField';

import chromInfoHg19 from './chrom_info';

describe('A search field', () => {
  // 'https://s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt'

  const searchField = new SearchField(chromInfoHg19);

  it('should search for ranges', () => {
    let range1 = null;
    [range1] = searchField.searchPosition('chr17:7566932-7595655');

    expect(range1[0]).to.be.above(2000000000);
    expect(range1[1]).to.be.above(2000000000);

    [range1] = searchField.searchPosition('chr17:7566932-chr19:7595655');

    expect(range1[0]).to.be.above(2000000000);
    expect(range1[1]).to.be.above(2000000000);
  });

  it('should search for more than one chromosome', () => {
    let range1 = null;
    [range1] = searchField.searchPosition('chr1-chr2');

    expect(range1).to.eql([0, 492449994]);

    [range1] = searchField.searchPosition('chr2-chr1');
    expect(range1).to.eql([0, 492449994]);

    [range1] = searchField.searchPosition('chr1 & chr2');

    // expect(range1).to.eql([1, 249250621]);
    // expect(range2).to.eql([249250622,492449994]);
  });

  it('it should search within the first chromosome', () => {
    let range1 = null;
    let range2 = null;
    [range1, range2] = searchField.searchPosition('chr1:1000000-chr1:2000000');

    expect(range1).to.eql([1000000, 2000000]);

    [range1, range2] = searchField.searchPosition(
      'chr1:2000000-chr1:3000000 & chr1:1000000-chr1:2000000',
    );

    expect(range1).to.eql([2000000, 3000000]);
    expect(range2).to.eql([1000000, 2000000]);
  });

  it('should search for entire chromosomes', () => {
    let range1 = null;
    [range1] = searchField.searchPosition('chr1');

    expect(range1).to.eql([0, 249250621]);

    [range1] = searchField.searchPosition('chr1 & chr2');

    // expect(range1).to.eql([1, 249250621]);
    // expect(range2).to.eql([249250622,492449994]);
  });

  it('should search for ranges when K and M notations are used', () => {
    let range1 = null;
    let range2 = null;
    [range1] = searchField.searchPosition('chr1:150M-155M');

    expect(range1[0]).to.eql(150000000);
    expect(range1[1]).to.eql(155000000);

    [range1] = searchField.searchPosition('chr1:30K-chr1:120K');

    expect(range1[0]).to.eql(30000);
    expect(range1[1]).to.eql(120000);

    [range1, range2] = searchField.searchPosition(
      'chr1:2M-chr1:3M & chr1:1M-chr1:2M',
    );

    expect(range1).to.eql([2000000, 3000000]);
    expect(range2).to.eql([1000000, 2000000]);
  });

  it('should convert K and M notations in numbers', () => {
    let number1 = null;
    let number2 = null;

    number1 = searchField.convertNumberNotation('150000000');
    expect(number1).to.eql('150000000');

    number1 = searchField.convertNumberNotation('150M');
    expect(number1).to.eql('150000000');

    number1 = searchField.convertNumberNotation('1.5M');
    expect(number1).to.eql('1500000');

    number2 = searchField.convertNumberNotation('1.50M');
    expect(number1 === number2).to.eql(true);

    number1 = searchField.convertNumberNotation('0.05M');
    expect(number1).to.eql('50000');

    number2 = searchField.convertNumberNotation('00.05M');
    expect(number1 === number2).to.eql(true);

    number2 = searchField.convertNumberNotation('0.050M');
    expect(number1 === number2).to.eql(true);

    // Invalid value
    number1 = searchField.convertNumberNotation('0.x0.05M');
    expect(number1).to.eql('0.x0.05M');

    // Value that is less than 1
    number1 = searchField.convertNumberNotation('0.00001K');
    expect(number1).to.eql('0.00001K');
  });
});
