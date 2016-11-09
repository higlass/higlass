import React from 'react';
import ReactDOM from 'react-dom';
import {HiGlassApp} from './HiGlassApp.js';
import $ from 'jquery';

let developmentDemo = JSON.parse(`
        { "views":
            [
            {
                "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
                "domain": [
                    0,
                    3000000000
                ],
                "viewStyle": {
                    "float": "left",
                    "padding": "5px",
                    "width": "100%"
                },
                "tracks": [
                {
                    "source": "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
                    "type": "top-chromosome-axis"
                },
                {
                    "source": "//52.23.165.123:9872/hg19/refgene-tiles-plus",
                    "type": "top-gene-labels"
                },
                {
                    "source": "//52.23.165.123:9872/hg19.1/wgEncodeSydhTfbsGm12878Pol2s2IggmusSig.bigWig.bedGraph.genome.sorted.gz",
                    "type": "top-line"
                },
                {
                    "source": "//52.23.165.123:9872/hg19.1/wgEncodeSydhTfbsGm12878Pol2s2IggmusSig.bigWig.bedGraph.genome.sorted.gz",
                    "type": "left-bar"
                },

                {
                    "source": "//52.23.165.123:9872/hg19/hg19.UMB5144.all_bins.sorted.genome.gz",
                    "type": "top-ratio-point"
                },
                {
                    "source": "//52.23.165.123:9872/hg19.1/Rao2014-GM12878-MboI-allreps-filtered.1kb.cool.reduced.genome.gz",
                    "type": "heatmap"
                }
                ],
                "zoomLock" : 0,
                "searchBox": {
                    "autocompleteSource": "//52.45.229.11:9872/hg19/autocomplete"
                },
                "layout": {"x":0,"y":0,"w":6,"h":7,"minH":7,"maxH":7,"i":"UPOrvJV5RaaEzca7G7PNBw"}
            }
            ],
            "editable": true
        }
        `);


try {
ReactDOM.render(
    <HiGlassApp viewConfigString={JSON.stringify(developmentDemo)}/>
    , document.getElementById('development-demo')
    );
} catch (e) {
    console.log('error:', e);
}
