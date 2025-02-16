import * as vi from 'vitest';

import tileProxy, {
  tileDataToPixData,
} from '../app/scripts/services/tile-proxy';
import fakePubSub from '../app/scripts/utils/fake-pub-sub';
import { defaultColorScale } from './testdata/colorscale-data';
import {
  multivecTileData,
  multivecTileDataWithServerAggregation,
} from './testdata/multivec-data';

vi.describe('tileProxy.json()', () => {
  vi.it('is a function', () => {
    vi.expect(typeof tileProxy.json).to.eql('function');
  });

  vi.it(
    'handles json callback',
    () =>
      new Promise((done) => {
        tileProxy.json(
          'http://higlass.io/api/v1/available-chrom-sizes/',
          (_, jsonResponse) => {
            vi.expect(Object.keys(jsonResponse)).to.eql(['count', 'results']);
            done(null);
          },
          fakePubSub,
        );
      }),
  );
});

vi.describe('tile-proxy text', () => {
  vi.it('is a function', () => {
    vi.expect(typeof tileProxy.json).to.eql('function');
  });

  /*
  Failed assertions in the callback are caught inside fetchEither,
  instead of failing out immediately, and the ultimate test failure
  is an uninformative timeout. Perhaps get rid of our catch?
  */
  vi.it(
    'handles text callback',
    () =>
      new Promise((done) => {
        tileProxy.text(
          'http://higlass.io/api/v1/available-chrom-sizes/',
          (_, textResponse) => {
            vi.expect(textResponse).to.have.string('count');
            vi.expect(textResponse).to.have.string('results');
            done(null);
          },
          fakePubSub,
        );
      }),
  );

  vi.it(
    'handles tileDataToPixData callback with client-side multivec aggregation',
    () =>
      new Promise((done) => {
        // Set up the function parameters.
        const selectedRowsOptions = {
          selectedRows: [0, [1, 2, 3], [4, 5]],
          selectedRowsAggregationMode: 'mean',
          selectedRowsAggregationWithRelativeHeight: false,
          selectedRowsAggregationMethod: 'client',
        };

        tileDataToPixData(
          {
            tileData: multivecTileData,
          },
          'log',
          [5, 100000],
          0,
          defaultColorScale,
          (data) => {
            vi.assert(data, 'no tile data');
            const { pixData } = data;
            vi.expect(pixData.length).to.eql(3072);

            // Spot-check some pixData entries.
            vi.expect(pixData[0]).to.eql(92);
            vi.expect(pixData[1]).to.eql(201);
            vi.expect(pixData[2]).to.eql(99);
            vi.expect(pixData[3]).to.eql(255);
            vi.expect(pixData[3070]).to.eql(105);
            vi.expect(pixData[3071]).to.eql(255);
            done(null);
          },
          false,
          false,
          [105, 105, 105, 255],
          selectedRowsOptions,
        );
      }),
  );

  vi.it(
    'handles tileDataToPixData callback with server-side multivec aggregation',
    () =>
      new Promise((done) => {
        // Set up the function parameters.
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
            vi.assert(data, 'no tile data');
            const { pixData } = data;
            vi.expect(pixData.length).to.eql(3072);
            // Spot-check some pixData entries.
            vi.expect(pixData[0]).to.eql(92);
            vi.expect(pixData[1]).to.eql(201);
            vi.expect(pixData[2]).to.eql(99);
            vi.expect(pixData[3]).to.eql(255);
            vi.expect(pixData[3070]).to.eql(105);
            vi.expect(pixData[3071]).to.eql(255);
            done(null);
          },
          false,
          false,
          [105, 105, 105, 255],
          selectedRowsOptions,
        );
      }),
  );
});
