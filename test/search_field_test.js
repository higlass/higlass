import {scaleLinear} from 'd3-scale';
import {SearchField} from '../app/scripts/search_field.js';
import {ChromosomeInfo} from '../app/scripts/ChromosomeInfo.js';

import {chromInfoHg19} from './chrom_info.js';


describe("A search field", function() {
    // 'https://s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt'

    let searchField = new SearchField(chromInfoHg19);

    it ("should search for more than one chromosome", function() {
        let range1=null, range2=null;
        [range1, range2] = searchField.searchPosition('chrX-chr22');

        [range1, range2] = searchField.searchPosition('chr1-chr2');

        expect(range1).toEqual([0, 492449994]);

        [range1, range2] = searchField.searchPosition('chr2-chr1');
        expect(range1).toEqual([0, 492449994]);

        [range1, range2] = searchField.searchPosition('chr1 & chr2');

      //expect(range1).toEqual([1, 249250621]);
      //expect(range2).toEqual([249250622,492449994]);
    });

    it ("it should search within the first chromosome", function() {
        let range1=null, range2=null;
        [range1, range2] = searchField.searchPosition('chr1:1000000-chr1:2000000');

        expect(range1).toEqual([1000000, 2000000]);

        [range1, range2] = searchField.searchPosition('chr1:2000000-chr1:3000000 & chr1:1000000-chr1:2000000');

        expect(range1).toEqual([2000000,3000000]);
        expect(range2).toEqual([1000000,2000000]);
    });

    it ("should search for entire chromosomes", function() {
        let range1=null, range2=null;
        [range1, range2] = searchField.searchPosition('chr1');

        expect(range1).toEqual([0, 249250621]);

        [range1, range2] = searchField.searchPosition('chr1 & chr2');

      //expect(range1).toEqual([1, 249250621]);
      //expect(range2).toEqual([249250622,492449994]);
    });
});
