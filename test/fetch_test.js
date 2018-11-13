import { expect } from 'chai';
import api from '../app/scripts/services/tile-proxy';


describe('tile-proxy json', () => {
  it('is a function', () => {
    expect(typeof (api.json)).to.eql('function');
  });

  it('handles json callback', (done) => {
    api.json(
      'http://higlass.io/api/v1/available-chrom-sizes/',
      (status, jsonResponse) => {
        expect(Object.keys(jsonResponse)).to.eql(['count', 'results']);
        done();
      }
    );
  });
});

describe('tile-proxy text', () => {
  it('is a function', () => {
    expect(typeof (api.json)).to.eql('function');
  });

  /*
  Failed assertions in the callback are caught inside fetchEither,
  instead of failing out immediately, and the ultimate test failure
  is an uninformative timeout. Perhaps get rid of our catch?
  */
  it('handles text callback', (done) => {
    api.text(
      'http://higlass.io/api/v1/available-chrom-sizes/',
      (status, textResponse) => {
        expect(textResponse).to.have.string('count');
        expect(textResponse).to.have.string('results');
        done();
      }
    );
  });
});
