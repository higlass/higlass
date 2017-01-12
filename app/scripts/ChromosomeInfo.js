import {text} from 'd3-request';
import {tsvParseRows} from 'd3-dsv';

export function ChromosomeInfo(filepath, success) {
    text(filepath, (text) => {
        console.log('text:', text);
        let data = tsvParseRows(text);
        let cumValues = [];
        let chrPositions = {};
        let totalLength = 0;

        for (let i = 0; i < data.length; i++) {
            totalLength += +data[i][1];

            let newValue = {'id': i, 'chr': data[i][0], 'pos': totalLength - +data[i][1]}

            cumValues.push(newValue);
            chrPositions[newValue.chr] = newValue;
        }

        let chromInfo = {'cumPositions': cumValues,
                         'chrPositions': chrPositions,
                          'totalLength': totalLength }

        success(chromInfo);
    });
}
