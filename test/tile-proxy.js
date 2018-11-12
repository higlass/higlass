import { expect } from 'chai';

import tileProxy from '../app/scripts/services/tile-proxy';
import { fake as fakePubSub } from '../app/scripts/hocs/with-pub-sub';

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
      fakePubSub
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
      fakePubSub
    );
  });
});
