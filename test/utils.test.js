import { describe, expect, it } from 'vitest';

import * as utils from '../app/scripts/utils';
import selectedItemsToCumWeights from '../app/scripts/utils/selected-items-to-cum-weights';

import { oneViewConfig } from './view-configs';

/** @import * as t from '../app/scripts/types' */

describe('visitPositionedTracks', () => {
  it('should visit all tracks and find a specific track by UID', () => {
    let found = false;
    let visited = 0;
    /** @type {{ [K in t.TrackPosition]?: Array<t.TrackConfig> }} */
    // @ts-expect-error - `.json` imports cannot be @const, meaning 'type' is always string.
    const tracks = oneViewConfig.views[0].tracks;
    utils.visitPositionedTracks(tracks, (track) => {
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
    expect(utils.selectedItemsToSize(selectRows, true)).toBe(7);
  });

  it('should return top-level item count when ignoring nested arrays', () => {
    expect(utils.selectedItemsToSize(selectRows, false)).toBe(5);
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

describe('reduce', () => {
  it('should sum array elements starting from 0', () => {
    const sumFrom0 = utils.reduce((a, b) => a + b, 0);
    expect(sumFrom0([1, 2, 3, 4])).toBe(10);
  });

  it('should sum array elements starting from a given number', () => {
    const sumFrom10 = utils.reduce((a, b) => a + b, 10);
    expect(sumFrom10([1, 2, 3, 4])).toBe(20);
  });
});

describe('flatten', () => {
  it('should flatten a nested array into a single-level array', () => {
    expect(utils.flatten([[1, 2], [3, 4, 5], [6]])).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('colorDomainToRgbaArray', () => {
  it.each(
    /** @type {const} */ ([
      { colors: ['red', 'blue'], description: 'named' },
      { colors: ['#ff0000', '#0000ff'], description: 'hex' },
      { colors: ['rgba(255,0,0,1)', 'rgba(0,0,255,1)'], description: 'RGBA' },
    ]),
  )('generates RGBA array with transparency for $description', ({ colors }) => {
    const range = utils.colorDomainToRgbaArray(colors);
    expect(range.length).toBe(256);
    expect(range.at(2)).toEqual([3, 0, 252, 255]);
    expect(range.at(50)).toEqual([51, 0, 204, 255]);
    expect(range.at(-10)).toEqual([247, 0, 8, 255]);
    expect(range.at(-1)).toEqual([255, 255, 255, 0]);
  });

  it('generates correct RGBA array without transparency', () => {
    const range = utils.colorDomainToRgbaArray(
      ['yellow', 'green'],
      /* noTransparent */ true,
    );
    expect(range.length).toBe(256);
    expect(range.at(2)).toEqual([2, 129, 0, 255]);
    expect(range.at(50)).toEqual([50, 153, 0, 255]);
    expect(range.at(-10)).toEqual([246, 251, 0, 255]);
    expect(range.at(-1)).toEqual([255, 255, 0, 255]);
  });
});

describe('expandCombinedTracks', () => {
  it('expands nested tracks', () => {
    /** @type {Array<t.TrackConfig>} */
    const trackList = [
      oneViewConfig.views[0].tracks.top[0],
      oneViewConfig.views[0].tracks.left[0],
      // @ts-expect-error - `.json` imports cannot be @const, meaning 'type' is always string.
      ...oneViewConfig.views[0].tracks.center, // combined
    ];
    const tracks = utils.expandCombinedTracks(trackList);
    expect(tracks.length).toBe(4);
  });
});
