import api from '../app/scripts/services/tile-proxy';

import { expect } from 'chai';


describe('tile-proxy fetch helper', function() {

	it('should have json function', function() {
		expect(typeof(api.json)).to.eql('function');
	});

	it('should have text function', function() {
		expect(typeof(api.json)).to.eql('function');
	});

});
