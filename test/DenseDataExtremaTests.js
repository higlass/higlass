/* eslint-env node, jasmine */
import DenseDataExtrema1D from '../app/scripts/utils/DenseDataExtrema1D';
import DenseDataExtrema2D from '../app/scripts/utils/DenseDataExtrema2D';
import { vecToy, vecRealistic } from './testdata/vector-data';
import { matToy, matRealistic } from './testdata/matrix-data';

describe('DenseDataExtrema()', () => {
  it('should get precise extrema of toy vectors', () => {
    const dde = new DenseDataExtrema1D(vecToy);

    expect(dde.minNonZeroInTile).toEqual(1);
    expect(dde.maxNonZeroInTile).toEqual(63);

    expect(dde.getMinNonZeroInSubset([0, 1])).toEqual(Number.MAX_SAFE_INTEGER);

    expect(dde.getMinNonZeroInSubset([10, 33])).toEqual(10);
    expect(dde.getMaxNonZeroInSubset([10, 33])).toEqual(32);
    expect(dde.getMinNonZeroInSubset([21, 64])).toEqual(21);
    expect(dde.getMaxNonZeroInSubset([21, 64])).toEqual(63);
  });

  it('should get precise extrema of realistic vectors', () => {
    const dde = new DenseDataExtrema1D(vecRealistic);

    expect(dde.minNonZeroInTile).toEqual(0.0004627704620361328);
    expect(dde.maxNonZeroInTile).toEqual(0.075439453125);

    expect(dde.getMinNonZeroInSubset([76, 771])).toEqual(0.0009503364562988281);
    expect(dde.getMaxNonZeroInSubset([76, 771])).toEqual(0.01194000244140625);
  });

  it('should get approximate extrema of toy matrix', () => {
    const dde = new DenseDataExtrema2D(matToy);

    expect(dde.minNonZeroInTile).toEqual(1);
    expect(dde.maxNonZeroInTile).toEqual(255);

    expect(dde.getMinNonZeroInSubset([0, 0, 1, 1])).toEqual(1);
    expect(dde.getMaxNonZeroInSubset([0, 0, 1, 1])).toEqual(17);

    expect(dde.getMinNonZeroInSubset([0, 2, 2, 5])).toEqual(32);
    expect(dde.getMaxNonZeroInSubset([0, 2, 2, 5])).toEqual(83);
  });

  it('should get approximate extrema of realistic vectors', () => {
    const dde = new DenseDataExtrema2D(matRealistic);

    expect(dde.minNonZeroInTile).toEqual(1);
    expect(dde.maxNonZeroInTile).toEqual(5748);

    expect(dde.getMinNonZeroInSubset([28, 40, 250, 120])).toEqual(1);
    expect(dde.getMaxNonZeroInSubset([28, 40, 250, 120])).toEqual(196);
  });
});
