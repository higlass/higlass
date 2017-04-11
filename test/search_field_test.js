import {scaleLinear} from 'd3-scale';
import {SearchField} from '../app/scripts/search_field.js';
import {ChromosomeInfo} from '../app/scripts/ChromosomeInfo.js';

let chromInfo = JSON.parse('{"cumPositions":[{"id":0,"chr":"chr1","pos":0},{"id":1,"chr":"chr2","pos":249250621},{"id":2,"chr":"chr3","pos":492449994},{"id":3,"chr":"chr4","pos":690472424},{"id":4,"chr":"chr5","pos":881626700},{"id":5,"chr":"chr6","pos":1062541960},{"id":6,"chr":"chr7","pos":1233657027},{"id":7,"chr":"chrX","pos":1392795690},{"id":8,"chr":"chr8","pos":1548066250},{"id":9,"chr":"chr9","pos":1694430272},{"id":10,"chr":"chr10","pos":1835643703},{"id":11,"chr":"chr11","pos":1971178450},{"id":12,"chr":"chr12","pos":2106184966},{"id":13,"chr":"chr13","pos":2240036861},{"id":14,"chr":"chr14","pos":2355206739},{"id":15,"chr":"chr15","pos":2462556279},{"id":16,"chr":"chr16","pos":2565087671},{"id":17,"chr":"chr17","pos":2655442424},{"id":18,"chr":"chr18","pos":2736637634},{"id":19,"chr":"chr20","pos":2814714882},{"id":20,"chr":"chrY","pos":2877740402},{"id":21,"chr":"chr19","pos":2937113968},{"id":22,"chr":"chr22","pos":2996242951},{"id":23,"chr":"chr21","pos":3047547517}],"chrPositions":{"chr1":{"id":0,"chr":"chr1","pos":0},"chr2":{"id":1,"chr":"chr2","pos":249250621},"chr3":{"id":2,"chr":"chr3","pos":492449994},"chr4":{"id":3,"chr":"chr4","pos":690472424},"chr5":{"id":4,"chr":"chr5","pos":881626700},"chr6":{"id":5,"chr":"chr6","pos":1062541960},"chr7":{"id":6,"chr":"chr7","pos":1233657027},"chrX":{"id":7,"chr":"chrX","pos":1392795690},"chr8":{"id":8,"chr":"chr8","pos":1548066250},"chr9":{"id":9,"chr":"chr9","pos":1694430272},"chr10":{"id":10,"chr":"chr10","pos":1835643703},"chr11":{"id":11,"chr":"chr11","pos":1971178450},"chr12":{"id":12,"chr":"chr12","pos":2106184966},"chr13":{"id":13,"chr":"chr13","pos":2240036861},"chr14":{"id":14,"chr":"chr14","pos":2355206739},"chr15":{"id":15,"chr":"chr15","pos":2462556279},"chr16":{"id":16,"chr":"chr16","pos":2565087671},"chr17":{"id":17,"chr":"chr17","pos":2655442424},"chr18":{"id":18,"chr":"chr18","pos":2736637634},"chr20":{"id":19,"chr":"chr20","pos":2814714882},"chrY":{"id":20,"chr":"chrY","pos":2877740402},"chr19":{"id":21,"chr":"chr19","pos":2937113968},"chr22":{"id":22,"chr":"chr22","pos":2996242951},"chr21":{"id":23,"chr":"chr21","pos":3047547517}},"totalLength":3137161264}')

describe("A search field", function() {
    // 'https://s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt'

    let searchField = new SearchField(chromInfo);

    it ("sould do something", function() {
        let range1=null, range2=null;
        [range1, range2] = searchField.searchPosition('chr1:1000000-chr1:2000000');

        expect(range1).toEqual([1000000, 2000000]);

        [range1, range2] = searchField.searchPosition('chr1:2000000-chr1:3000000 & chr1:1000000-chr1:2000000');

        expect(range1).toEqual([2000000,3000000]);
        expect(range2).toEqual([1000000,2000000]);
    });
});
