import { scaleLinear } from 'd3-scale';
import { describe, expect, it } from 'vitest';

import trackUtils from '../app/scripts/track-utils';

describe('calculate1DVisibleTiles', () => {
  const tilesetInfo = (minPos, maxPos) => ({
    resolutions: [1],
    min_pos: [minPos],
    max_pos: [maxPos],
    tile_size: 256,
  });
  const scale = (lo, hi) => scaleLinear().domain([lo, hi]).range([0, 1000]);

  it('stops at max_pos when min_pos is 0', () => {
    expect(
      trackUtils.calculate1DVisibleTiles(
        tilesetInfo(0, 1000),
        scale(-5000, 5000),
      ),
    ).to.eql([
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ]);
  });

  it('stops at max_pos when min_pos is not 0', () => {
    expect(
      trackUtils.calculate1DVisibleTiles(
        tilesetInfo(10000, 11000),
        scale(-5000, 50000),
      ),
    ).to.eql([
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ]);
  });
});
