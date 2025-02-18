import { describe, expect, it } from 'vitest';

import selectedItemsToCumWeights from '../app/scripts/utils/selected-items-to-cum-weights';
import selectedItemsToSize from '../app/scripts/utils/selected-items-to-size';
import visitPositionedTracks from '../app/scripts/utils/visit-positioned-tracks';

import { oneViewConfig } from './view-configs';

/** @import * as t from '../app/scripts/types' */

describe('visitPositionedTracks', () => {
  it('should visit all tracks and find a specific track by UID', () => {
    let found = false;
    let visited = 0;
    /** @type {{ [K in t.TrackPosition]?: Array<t.TrackConfig> }} */
    // @ts-expect-error - `.json` imports cannot be @const, meaning 'type' is always string.
    const tracks = oneViewConfig.views[0].tracks;
    visitPositionedTracks(tracks, (track) => {
      if (track.uid === 'c1') {
        found = true;
      }
      visited++;
    });
    expect(found).toBe(true);
    expect(visited).toBe(6);
  });
});

describe('selectedItemsToSize', () => {
  const selectRows = [1, [2, 3, 4], [5], 6, 7];

  it('should return total item count when counting nested arrays', () => {
    expect(selectedItemsToSize(selectRows, true)).toBe(7);
  });

  it('should return top-level item count when ignoring nested arrays', () => {
    expect(selectedItemsToSize(selectRows, false)).toBe(5);
  });
});

describe('selectedItemsToCumWeights', () => {
  const selectRows = [1, [2, 3, 4], [5], 6, 7];
  const delta = 0.01;

  it('should compute cumulative weights with nested items counted', () => {
    const weights = selectedItemsToCumWeights(selectRows, true);
    expect(weights[0]).to.be.closeTo(0.143, delta);
    expect(weights[1]).to.be.closeTo(0.571, delta);
    expect(weights[2]).to.be.closeTo(0.714, delta);
    expect(weights[3]).to.be.closeTo(0.857, delta);
    expect(weights[4]).to.be.closeTo(1, delta);
  });

  it('should compute cumulative weights with only top-level items counted', () => {
    const weights = selectedItemsToCumWeights(selectRows, false);
    expect(weights[0]).to.be.closeTo(0.2, delta);
    expect(weights[1]).to.be.closeTo(0.4, delta);
    expect(weights[2]).to.be.closeTo(0.6, delta);
    expect(weights[3]).to.be.closeTo(0.8, delta);
    expect(weights[4]).to.be.closeTo(1, delta);
  });
});
