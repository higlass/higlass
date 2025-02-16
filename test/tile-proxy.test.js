import { assert, describe, expect, it } from 'vitest';

import tileProxy, {
  tileDataToPixData,
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
