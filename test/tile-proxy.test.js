import { assert, describe, expect, it } from 'vitest';

import tileProxy, {
  tileDataToPixData,
  bundleRequestsById,
  bundleRequestsByServer,
} from '../app/scripts/services/tile-proxy';
import fakePubSub from '../app/scripts/utils/fake-pub-sub';
import { defaultColorScale } from './testdata/colorscale-data';
import {
  multivecTileData,
  multivecTileDataWithServerAggregation,
} from './testdata/multivec-data';

describe('tileProxy.json()', () => {
  it('is a function', () => {
    expect(typeof tileProxy.json).to.eql('function');
  });

  it('handles json callback', () =>
    new Promise((done) => {
      tileProxy.json(
        'http://higlass.io/api/v1/available-chrom-sizes/',
        (_, jsonResponse) => {
          expect(Object.keys(jsonResponse)).to.eql(['count', 'results']);
          done(null);
        },
        fakePubSub,
      );
    }));
});

describe('tile-proxy text', () => {
  it('is a function', () => {
    expect(typeof tileProxy.json).to.eql('function');
  });

  it('handles text callback', () =>
    new Promise((done) => {
      tileProxy.text(
        'http://higlass.io/api/v1/available-chrom-sizes/',
        (_, textResponse) => {
          expect(textResponse).to.have.string('count');
          expect(textResponse).to.have.string('results');
          done(null);
        },
        fakePubSub,
      );
    }));

  it('handles tileDataToPixData callback with client-side multivec aggregation', () =>
    new Promise((done) => {
      /** @satisfies {import("../app/scripts/services/worker").SelectedRowsOptions} */
      const selectedRowsOptions = {
        selectedRows: [0, [1, 2, 3], [4, 5]],
        selectedRowsAggregationMode: 'mean',
        selectedRowsAggregationWithRelativeHeight: false,
        selectedRowsAggregationMethod: 'client',
      };

      // Call the function.
      tileDataToPixData(
        {
          tileData: multivecTileData,
        },
        'log',
        [5, 100000],
        0,
        defaultColorScale,
        (data) => {
          assert(data, 'no data');
          const { pixData } = data;

          expect(pixData.length).to.eql(3072);
          expect(pixData[0]).to.eql(92);
          expect(pixData[1]).to.eql(201);
          expect(pixData[2]).to.eql(99);
          expect(pixData[3]).to.eql(255);
          expect(pixData[3070]).to.eql(105);
          expect(pixData[3071]).to.eql(255);
          done(null);
        },
        false,
        false,
        [105, 105, 105, 255],
        selectedRowsOptions,
      );
    }));

  it('handles tileDataToPixData callback with server-side multivec aggregation', () =>
    new Promise((done) => {
      /** @satisfies {import("../app/scripts/services/worker").SelectedRowsOptions} */
      const selectedRowsOptions = {
        selectedRows: [0, [1, 2, 3], [4, 5]],
        selectedRowsAggregationMode: 'mean',
        selectedRowsAggregationWithRelativeHeight: false,
        selectedRowsAggregationMethod: 'server',
      };

      // Call the function.
      tileDataToPixData(
        {
          tileData: multivecTileDataWithServerAggregation,
        },
        'log',
        [5, 100000],
        0,
        defaultColorScale,
        (data) => {
          assert(data, 'no tile data');
          const { pixData } = data;
          expect(pixData.length).to.eql(3072);

          // Spot-check some pixData entries.
          expect(pixData[0]).to.eql(92);
          expect(pixData[1]).to.eql(201);
          expect(pixData[2]).to.eql(99);
          expect(pixData[3]).to.eql(255);
          expect(pixData[3070]).to.eql(105);
          expect(pixData[3071]).to.eql(255);

          done(null);
        },
        false,
        false,
        [105, 105, 105, 255],
        selectedRowsOptions,
      );
    }));
});

describe('bundleRequestsById', () => {
  it('merges requests with the same id', () => {
    expect(
      bundleRequestsById([
        { id: 'A', ids: ['1', '2'], answer: 42 },
        { id: 'B', ids: ['3'], bar: 'baz' },
        { id: 'A', ids: ['4', '5'], answer: 123 },
      ]),
    ).toEqual([
      { id: 'A', ids: ['1', '2', '4', '5'], answer: 42 },
      { id: 'B', ids: ['3'], bar: 'baz' },
    ]);
  });

  it('returns the same array when all ids are unique', () => {
    expect(
      bundleRequestsById([
        { id: 'X', ids: ['10'] },
        { id: 'Y', ids: ['20', '30'] },
      ]),
    ).toEqual([
      { id: 'X', ids: ['10'] },
      { id: 'Y', ids: ['20', '30'] },
    ]);
  });

  it('returns an empty array when input is empty', () => {
    expect(bundleRequestsById([])).toEqual([]);
  });
});

describe('bundleRequestsByServer', () => {
  /**
   * @param {ReturnType<typeof bundleRequestsByServer>} requests
   */
  function toLegacy(requests) {
    return {
      requestsByServer: Object.fromEntries(
        requests.map((r) => [
          r.server,
          Object.fromEntries(r.ids.map((id) => [id, true])),
        ]),
      ),
      requestBodyByServer: Object.fromEntries(
        requests.map((r) => [r.server, r.body]),
      ),
    };
  }

  it('merges requests for the same server and combines ids', () => {
    const result = bundleRequestsByServer([
      { server: 'A', ids: ['AA.1', 'AA.2'] },
      { server: 'B', ids: ['BB.3'] },
      { server: 'A', ids: ['AA.4', 'AA.5'] },
      { server: 'A', ids: ['BB.4', 'BB.5'] },
    ]);
    expect(result).toMatchInlineSnapshot();
    expect(toLegacy(result)).toMatchInlineSnapshot(`
      {
        "requestBodyByServer": {
          "A": [],
          "B": [],
        },
        "requestsByServer": {
          "A": {
            "AA.1": true,
            "AA.2": true,
            "AA.4": true,
            "AA.5": true,
            "BB.4": true,
            "BB.5": true,
          },
          "B": {
            "BB.3": true,
          },
        },
      }
    `);
  });

  it('creates and appends body entries for request with options', () => {
    const result = bundleRequestsByServer([
      { server: 'A', ids: ['AA.1', 'AA.2'], options: { answer: 42 } },
      { server: 'B', ids: ['BB.3'], options: { name: 'monty' } },
      { server: 'A', ids: ['AA.4', 'AA.5'] },
      { server: 'A', ids: ['BB.4', 'BB.5'], options: { name: 'python' } },
    ]);
    expect(result).toMatchInlineSnapshot();
    expect(toLegacy(result)).toEqual({
      requestBodyByServer: {
        A: [
          {
            tilesetUid: 'AA',
            tileIds: ['1', '2'],
            options: { answer: 42 },
          },
          {
            tilesetUid: 'BB',
            tileIds: ['4', '5'],
            options: { name: 'python' },
          },
        ],
        B: [
          {
            tilesetUid: 'BB',
            tileIds: ['3'],
            options: { name: 'monty' },
          },
        ],
      },
      requestsByServer: {
        A: {
          'AA.1': true,
          'AA.2': true,
          'AA.4': true,
          'AA.5': true,
          'BB.4': true,
          'BB.5': true,
        },
        B: {
          'BB.3': true,
        },
      },
    });
  });

  it('returns the same array when all servers are unique', () => {
    const result = bundleRequestsByServer([
      { server: 'X', ids: ['foo.10'] },
      { server: 'Y', ids: ['bar.20', 'bar.30'] },
    ]);
    expect(result).toMatchInlineSnapshot();
    expect(toLegacy(result)).toEqual({
      requestBodyByServer: {
        X: [],
        Y: [],
      },
      requestsByServer: {
        X: { 'foo.10': true },
        Y: { 'bar.20': true, 'bar.30': true },
      },
    });
  });

  it('returns an empty array when input is empty', () => {
    expect(bundleRequestsByServer([])).toMatchInlineSnapshot([]);
  });
});
