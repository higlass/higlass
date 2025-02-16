import * as vi from 'vitest';
import ndarray from 'ndarray';

import ndarrayAssign from '../app/scripts/utils/ndarray-assign';

vi.describe('ndarrayAssign()', () => {
  /** @type{ndarray.NdArray<any>} */
  let v;

  vi.beforeEach(() => {
    v = ndarray(new Array(3).fill(0).map((x, i) => i));
  });

  vi.it('can assign a scalar to a vector', () => {
    ndarrayAssign(v, 1);
    vi.expect(v.data).to.deep.equal([1, 1, 1]);
  });

  vi.it('can assign a scalar to a matrix', () => {
    const z = ndarray(new Array(3 * 4).fill(0), [3, 4]);
    ndarrayAssign(z.hi(2, 3).lo(1, 1), 1);

    vi.expect(z.data).to.deep.equal([0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0]);
  });

  vi.it('can assign a vector to another', () => {
    ndarrayAssign(v, ndarray([2, 3, 4]));
    vi.expect(v.data).to.deep.equal([2, 3, 4]);
  });

  vi.it('can assign a matrix to another matrix', () => {
    const a = ndarray(
      new Array(4).fill(0).map((x, i) => i + 1),
      [2, 2],
    );
    const z = ndarray(new Array(4 * 4).fill(0), [4, 4]);
    ndarrayAssign(z.hi(3, 3).lo(1, 1), a);

    vi.expect(z.data).to.deep.equal([
      0, 0, 0, 0, 0, 1, 2, 0, 0, 3, 4, 0, 0, 0, 0, 0,
    ]);
  });
});
