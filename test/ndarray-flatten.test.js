import * as vi from 'vitest';
import ndarray from 'ndarray';
import ndarrayFlatten from '../app/scripts/utils/ndarray-flatten';

vi.describe('ndarrayFlatten()', () => {
  vi.it('should work on vectors', () => {
    vi.expect(ndarrayFlatten(ndarray([[0], [1], [2]])).shape).to.deep.equal([
      3,
    ]);
  });

  vi.it('should work on slided matrix', () => {
    const m = ndarray(
      new Array(16).fill(0).map((x, i) => i),
      [4, 4],
    )
      .hi(3, 3)
      .lo(1, 1);
    const flat = ndarrayFlatten(m);
    vi.expect(flat.shape).to.deep.equal([4]);
  });
});
