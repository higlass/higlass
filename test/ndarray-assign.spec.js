// @ts-nocheck
/* eslint-env mocha */
import { expect } from 'chai';
import ndarray from 'ndarray';
import ndarrayAssign from '../app/scripts/utils/ndarray-assign';

describe('ndarrayAssign()', () => {
  let v;

  beforeEach(() => {
    v = ndarray(new Array(3).fill(0).map((x, i) => i));
  });

  it('can assign a scalar to a vector', () => {
    ndarrayAssign(v, 1);
    expect(v.data).to.deep.equal([1, 1, 1]);
  });

  it('can assign a scalar to a matrix', () => {
    const z = ndarray(new Array(3 * 4).fill(0), [3, 4]);
    ndarrayAssign(z.hi(2, 3).lo(1, 1), 1);

    expect(z.data).to.deep.equal([0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0]);
  });

  it('can assign a vector to another', () => {
    ndarrayAssign(v, ndarray([2, 3, 4]));
    expect(v.data).to.deep.equal([2, 3, 4]);
  });

  it('can assign a matrix to another matrix', () => {
    const a = ndarray(
      new Array(4).fill(0).map((x, i) => i + 1),
      [2, 2],
    );
    const z = ndarray(new Array(4 * 4).fill(0), [4, 4]);
    ndarrayAssign(z.hi(3, 3).lo(1, 1), a);

    expect(z.data).to.deep.equal([
      0, 0, 0, 0, 0, 1, 2, 0, 0, 3, 4, 0, 0, 0, 0, 0,
    ]);
  });
});
