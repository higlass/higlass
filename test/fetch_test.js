import api from '../app/scripts/services/tile-proxy';

import { expect } from 'chai';


describe('tile-proxy json', function() {

	it('is a function', function() {
		expect(typeof(api.json)).to.eql('function');
	});
	
	it('handles json callback', function(done) {
	  api.json(
	    'http://higlass.io/api/v1/available-chrom-sizes/',
	    function(status, json_response) {
        expect(Object.keys(json_response)).to.eql(['count', 'results']);
        done();
      });
	});
	
});

describe('tile-proxy text', function() {

	it('is a function', function() {
		expect(typeof(api.json)).to.eql('function');
	});

  /* 
  Failed assertions in the callback are caught inside fetchEither,
  instead of failing out immediately, and the ultimate test failure
  is an uninformative timeout. Perhaps get rid of our catch?
  */
  it('handles text callback', function(done) {
    api.text(
      'http://higlass.io/api/v1/available-chrom-sizes/',
      function(status, text_response) {
        expect(text_response).to.have.string('count');
        expect(text_response).to.have.string('results');
        done();
      });
  });

});
