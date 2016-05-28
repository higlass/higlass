import d3 from 'd3';

export function ChromosomeInfo(filepath, success) {
    d3.text(filepath, (text) => {
        let data = d3.tsv.parseRows(text);
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
                          'totalLength': totalLength }

        success(chromInfo);
    });
}
