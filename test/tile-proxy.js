// @ts-nocheck
/* eslint-env mocha */
import { expect } from 'chai';

import tileProxy, {
  tileDataToPixData,
} from '../app/scripts/services/tile-proxy';
import { fake as fakePubSub } from '../app/scripts/hocs/with-pub-sub';
import {
  multivecTileData,
  multivecTileDataWithServerAggregation,
} from './testdata/multivec-data';
import { defaultColorScale } from './testdata/colorscale-data';

describe('tileProxy.json()', () => {
  it('is a function', () => {
    expect(typeof tileProxy.json).to.eql('function');
  });

  it('handles json callback', (done) => {
    tileProxy.json(
      'http://higlass.io/api/v1/available-chrom-sizes/',
      (status, jsonResponse) => {
        expect(Object.keys(jsonResponse)).to.eql(['count', 'results']);
        done();
      },
      fakePubSub,
    );
  });
});

describe('tile-proxy text', () => {
  it('is a function', () => {
    expect(typeof tileProxy.json).to.eql('function');
  });

  /*
  Failed assertions in the callback are caught inside fetchEither,
  instead of failing out immediately, and the ultimate test failure
  is an uninformative timeout. Perhaps get rid of our catch?
  */
  it('handles text callback', (done) => {
    tileProxy.text(
      'http://higlass.io/api/v1/available-chrom-sizes/',
      (status, textResponse) => {
        expect(textResponse).to.have.string('count');
        expect(textResponse).to.have.string('results');
        done();
      },
      fakePubSub,
    );
  });

  it('handles tileDataToPixData callback with client-side multivec aggregation', (done) => {
    // Set up the function parameters.
    const selectedRowsOptions = {
      selectedRows: [0, [1, 2, 3], [4, 5]],
      selectedRowsAggregationMode: 'mean',
      selectedRowsAggregationWithRelativeHeight: false,
      selectedRowsAggregationMethod: 'client',
    };

    // Create the finished callback, where we will make assertions.
    const finished = ({ pixData }) => {
      expect(pixData.length).to.eql(3072);

      // Spot-check some pixData entries.
      expect(pixData[0]).to.eql(92);
      expect(pixData[1]).to.eql(201);
      expect(pixData[2]).to.eql(99);
      expect(pixData[3]).to.eql(255);
      expect(pixData[3070]).to.eql(105);
      expect(pixData[3071]).to.eql(255);
      done();
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
      finished,
      false,
      false,
      [105, 105, 105, 255],
      selectedRowsOptions,
    );
  });

  it('handles tileDataToPixData callback with server-side multivec aggregation', (done) => {
    // Set up the function parameters.
    const selectedRowsOptions = {
      selectedRows: [0, [1, 2, 3], [4, 5]],
      selectedRowsAggregationMode: 'mean',
      selectedRowsAggregationWithRelativeHeight: false,
      selectedRowsAggregationMethod: 'server',
    };

    // Create the finished callback, where we will make assertions.
    const finished = ({ pixData }) => {
      expect(pixData.length).to.eql(3072);

      // Spot-check some pixData entries.
      expect(pixData[0]).to.eql(92);
      expect(pixData[1]).to.eql(201);
      expect(pixData[2]).to.eql(99);
      expect(pixData[3]).to.eql(255);
      expect(pixData[3070]).to.eql(105);
      expect(pixData[3071]).to.eql(255);
      done();
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
      finished,
      false,
      false,
      [105, 105, 105, 255],
      selectedRowsOptions,
    );
  });
});
