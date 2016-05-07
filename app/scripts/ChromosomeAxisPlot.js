import d3 from 'd3';

export function ChromosomeAxisPlot() {
    let xScale = null;

    function chart(selection) {
        selection.each(function(d) {
            console.log('d:', d);


            d3.text(d, function(text) {
                let data = d3.tsv.parseRows(text);
                let cumValues = [];
                console.log('text:', text);
                
                for (let i = 0; i < data.length; i++) {
                    if (i == 0) 
                        cumValues.push({'chr': data[i][0], 'pos': +data[i][1]});
                    else 
                        cumValues.push({'chr': data[i][0], 'pos': cumValues[i-1].pos + +data[i][1]});
                }

                console.log('cumValues:', cumValues);
            });
        });
    }

    chart.width = function(_) {
        if (!arguments.length) return width;
        else width = _;
        return chart;
    };

    chart.xScale = function(_) {
        if (!arguments.length) return xScale;
        else xScale = _;
        return chart;
    }

    return chart;
}
