import { describe, expect, it } from 'vitest';

import * as utils from '../app/scripts/utils';
import decodeGzip from '../app/scripts/utils/decode-gzip';
import { IntervalTree } from '../app/scripts/utils/interval-tree';
import positionedTracksToAllTracks from '../app/scripts/utils/positioned-tracks-to-all-tracks';
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

describe('fillInMinWidths', () => {
  it('fills in tracks with default min width and min height', () => {
    const tracks = utils.fillInMinWidths({
      top: [
        {
          uid: '1',
          type: 'horizontal-line',
          server: 'http://higlass.io/api/v1',
          tilesetUid: 'F2vbUeqhS86XkxuO1j2rPA',
        },
        {
          uid: '3',
          type: 'horizontal-line',
          server: 'http://higlass.io/api/v1',
          tilesetUid: 'F2vbUeqhS86XkxuO1j2rPA',
          options: {
            minHeight: 100,
          },
        },
      ],
      right: [
        {
          uid: '2',
          type: 'vertical-line',
          server: 'http://higlass.io/api/v1',
          tilesetUid: 'F2vbUeqhS86XkxuO1j2rPA',
        },
        {
          uid: '4',
          type: 'vertical-line',
          server: 'http://higlass.io/api/v1',
          tilesetUid: 'F2vbUeqhS86XkxuO1j2rPA',
          options: {
            minWidth: 100,
          },
        },
      ],
    });
    expect(tracks).toMatchInlineSnapshot(`
      {
        "bottom": [],
        "center": [],
        "gallery": [],
        "left": [],
        "right": [
          {
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "F2vbUeqhS86XkxuO1j2rPA",
            "type": "vertical-line",
            "uid": "2",
            "width": 20,
          },
          {
            "options": {
              "minWidth": 100,
            },
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "F2vbUeqhS86XkxuO1j2rPA",
            "type": "vertical-line",
            "uid": "4",
            "width": 100,
          },
        ],
        "top": [
          {
            "height": 20,
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "F2vbUeqhS86XkxuO1j2rPA",
            "type": "horizontal-line",
            "uid": "1",
          },
          {
            "height": 100,
            "options": {
              "minHeight": 100,
            },
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "F2vbUeqhS86XkxuO1j2rPA",
            "type": "horizontal-line",
            "uid": "3",
          },
        ],
        "whole": [],
      }
    `);
  });
});

describe('getDefaultTrackForDatatype', () => {
  it('finds fails to find track without any available', () => {
    expect(
      utils.getDefaultTrackForDatatype('vector', 'top', []),
    ).toBeUndefined();
  });

  // Trevor: Weird behavior of the method
  it('picks first track only one available, regardless of type', () => {
    expect(
      utils.getDefaultTrackForDatatype('vector', 'top', [{ type: 'blah' }]),
    ).toEqual({ type: 'blah' });
  });

  it('picks first available track with matching type', () => {
    expect(
      utils.getDefaultTrackForDatatype('vector', 'top', [
        {
          type: 'blah',
        },
        {
          type: 'bar',
          tag: 'first',
        },
        {
          type: 'bar',
          tag: 'second',
        },
      ]),
    ).toEqual({ type: 'bar', tag: 'first' });
  });
});

describe('getTrackPositionByUid', () => {
  /** @type {{ [K in t.TrackPosition]?: Array<t.TrackConfig> }} */
  // @ts-expect-error - `.json` imports cannot be @const, meaning 'type' is always string.
  const tracks = oneViewConfig.views[0].tracks;
  it('finds track position for uid', () => {
    expect(utils.getTrackPositionByUid(tracks, 'vline1')).toBe('left');
  });
  it('returns null when missing uid', () => {
    expect(utils.getTrackPositionByUid(tracks, 'blah')).toBe(null);
  });
});

describe('segmentsToRows', () => {
  it('partitions segments into non-overlapping rows', () => {
    const segments = [
      { from: 10, to: 20 },
      { from: 18, to: 30 },
      { from: 5, to: 15 },
      { from: 25, to: 35 },
    ];
    expect(utils.segmentsToRows(segments)).toEqual([
      [
        { from: 18, to: 30 },
        { from: 5, to: 15 },
      ],
      [
        { from: 10, to: 20 },
        { from: 25, to: 35 },
      ],
    ]);
  });

  it('handles an empty array', () => {
    expect(utils.segmentsToRows([])).toEqual([[]]);
  });

  it('handles non-overlapping segments', () => {
    const segments = [
      { from: 1, to: 5 },
      { from: 10, to: 15 },
      { from: 20, to: 25 },
    ];
    expect(utils.segmentsToRows(segments)).toEqual([
      [
        { from: 10, to: 15 },
        { from: 20, to: 25 },
        { from: 1, to: 5 },
      ],
    ]);
  });
});

describe('IntervalTree', () => {
  it('adds and contains intervals correctly', () => {
    const tree = new IntervalTree();
    tree.add([10, 20]);
    tree.add([30, 40]);

    expect(tree.contains(15)).toBe(true);
    expect(tree.contains(25)).toBe(false);
  });

  it('detects intersections correctly', () => {
    const tree = new IntervalTree();
    tree.add([10, 20]);
    tree.add([30, 40]);

    expect(tree.intersects([15, 25])).toBe(true);
    expect(tree.intersects([25, 29])).toBe(false);
  });
});

describe('positionedTracksToAllTracks', () => {
  it('flattens a position-indexed list of tracks into a flat list with positions', () => {
    const positionedTracks = {
      top: [{ type: 'line' }, { type: 'bar' }],
      center: [
        {
          type: 'combined',
          contents: [{ type: 'heatmap' }, { type: '2d-tiles' }],
        },
      ],
    };
    const result = positionedTracksToAllTracks(positionedTracks);
    expect(result).toEqual([
      { type: 'line', position: 'top' },
      { type: 'bar', position: 'top' },
      { type: 'heatmap', position: 'center' },
      { type: '2d-tiles', position: 'center' },
      {
        type: 'combined',
        position: 'center',
        contents: [{ type: 'heatmap' }, { type: '2d-tiles' }],
      },
    ]);
  });

  it('excludes combined contents when includeCombinedContents is false', () => {
    const positionedTracks = {
      top: [{ type: 'line' }],
      center: [
        {
          type: 'combined',
          contents: [{ type: 'heatmap' }],
        },
      ],
    };

    const result = positionedTracksToAllTracks(positionedTracks, {
      includeCombinedContents: false,
    });

    expect(result).toEqual([
      { type: 'line', position: 'top' },
      { type: 'combined', contents: [{ type: 'heatmap' }], position: 'center' },
      // No separate entry for 'heatmap'
    ]);
  });
});

describe('decodeGzip', () => {
  it('decodes compressed bytes', async () => {
    const compressed = new Uint8Array([
      0x1f, 0x8b, 0x08, 0x00, 0x1e, 0xc0, 0x7e, 0x67, 0x00, 0x03, 0xf3, 0x48,
      0xcd, 0xc9, 0xc9, 0xd7, 0x51, 0x28, 0xcf, 0x2f, 0xca, 0x49, 0x51, 0x04,
      0x00, 0xe6, 0xc6, 0xe6, 0xeb, 0x0d, 0x00, 0x00, 0x00,
    ]);

    const uncompressed = await decodeGzip(new Response(compressed), {
      format: 'gzip',
    });

    expect(new TextDecoder().decode(uncompressed)).toBe('Hello, world!');
  });
});
