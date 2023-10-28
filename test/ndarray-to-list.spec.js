// @ts-nocheck
/* eslint-env mocha */
import { expect } from 'chai';
import ndarray from 'ndarray';
import ndarrayToList from '../app/scripts/utils/ndarray-to-list';

describe('ndarrayToList()', () => {
  it('should work with numerical', () => {
    expect(ndarrayToList(ndarray([0, 1, 2]))).to.deep.equal([0, 1, 2]);
  });

  it('should work with structured data', () => {
    const m = ndarray([[[[0]]], [[1]], [2]]);
    expect(ndarrayToList(m)).to.deep.equal([[[[0]]], [[1]], [2]]);
  });

  it('should work with matrices', () => {
    const m = ndarray(
      new Array(4).fill(0).map((x, i) => i),
      [2, 2],
    );
    expect(ndarrayToList(m)).to.deep.equal([0, 1, 2, 3]);
  });

  it('should work with slided matrices', () => {
    const m = ndarray(
      new Array(16).fill(0).map((x, i) => i),
      [4, 4],
    )
      .hi(3, 3)
      .lo(1, 1);
    expect(ndarrayToList(m)).to.deep.equal([5, 6, 9, 10]);
  });
});
