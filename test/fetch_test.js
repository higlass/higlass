import api from '../app/scripts/services/tile-proxy';

import { expect } from 'chai';


describe('tile-proxy json', function() {

	it('is a function', function() {
		expect(typeof(api.json)).to.eql('function');
	});
	
	it('handles json', function(done) {
	  api.json(
	    'http://higlass.io/api/v1/available-chrom-sizes/',
	    function(status, json_response) {
        expect(Object.keys(json_response)).to.eql(['count', 'results']);
        done();
      });
	});

/* Blocked by CORB in Chrome: */
// 	it('errors out appropriately', function(done) {
// 	  api.json(
// 	    'http://higlass.io/no-such-url',
// 	    function(status, json_response) {
//         expect(status).to.eql('ERROR');
//         done();
//       });
// 	});
	
});

describe('tile-proxy text', function() {

	it('is a function', function() {
		expect(typeof(api.json)).to.eql('function');
	});

/* Times out */
//   it('handles text', function(done) {
//     api.text(
//       'http://higlass.io/api/v1/available-chrom-sizes/',
//       function(status, text_response) {
//         expect(text_response).to.eql('asdf!');
//         done();
//       });
//   });

});
