import React from 'react';
import ReactDOM from 'react-dom';
import {HiGlassApp} from './HiGlassApp.js';
import $ from 'jquery';

let rectangularOneWindow = JSON.parse(`
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
        "type": "top-chromosome-axis",
        "height": 25
      },
        {
        "source": "//52.23.165.123:9872/hg19.1/Rao2014-GM12878-MboI-allreps-filtered.1kb.cool.reduced.genome.gz",
        "type": "heatmap",
        "height": 300
      },
      {
        "source": "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
        "type": "left-chromosome-axis",
        "width": 25
      },
      {
        "source": "//52.23.165.123:9872/hg19/refgene-tiles-plus",
        "type": "left-gene-labels",
        "width": 25
      },
      {
        "source": "//52.23.165.123:9872/hg19/refgene-tiles-plus",
        "type": "top-gene-labels",
        "height": 25
      },

      {
        "source": "//52.23.165.123:9872/hg19.1/wgEncodeSydhTfbsGm12878Pol2s2IggmusSig.bigWig.bedGraph.genome.sorted.gz",
        "type": "top-line",
        "height": 25
      },
      {
        "type": "top-empty",
        "height": 5
      },
      {
        "source": "//52.23.165.123:9872/hg19.1/wgEncodeSydhTfbsGm12878Pol2s2IggmusSig.bigWig.bedGraph.genome.sorted.gz",
        "type": "left-bar",
        "width": 25
      },
      {
        "type": "left-empty",
        "width": 5
      }

    ],
    "zoomLock" : 0
  }
]
`)

try {
    ReactDOM.render(
            <HiGlassApp viewConfigString={JSON.stringify(rectangularOneWindow)}/>
            , document.getElementById('rectangular')
            );
} catch (e) {
    console.log('error:', e);
}

let triangularOneWindow = JSON.parse(`
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
      "width": "50%"
    },
    "tracks": [
        {
        "source": "//52.23.165.123:9872/hg19.1/Rao2014-GM12878-MboI-allreps-filtered.1kb.cool.reduced.genome.gz",
        "type": "top-diagonal-heatmap",
        "height": 100
      },
      {
        "source": "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
        "type": "top-chromosome-axis"
      },
      {
        "source": "//52.23.165.123:9872/hg19/refgene-tiles-plus",
        "type": "top-gene-labels",
        "height": 25
      },

      {
        "source": "//52.23.165.123:9872/hg19.1/wgEncodeSydhTfbsGm12878Pol2s2IggmusSig.bigWig.bedGraph.genome.sorted.gz",
        "type": "top-line",
        "height": 25
      }
    ],
    "zoomLock" : 0
  }
]
`)
let triangularTwoWindow = JSON.stringify(triangularOneWindow.concat(triangularOneWindow), null, 2);


try {
ReactDOM.render(
        <HiGlassApp viewConfigString={triangularTwoWindow}/>
    , document.getElementById('triangular-1')
    );
} catch (e) {
    console.log('Error:', e);
}

let oneDOneWindow = JSON.parse(`
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
        "type": "top-gene-labels",
        "height": 25
      },
      {
        "source": "//52.23.165.123:9872/hg19/refgene-tiles-minus",
        "type": "top-gene-labels",
        "height": 25
      },

      {
        "source": "//52.23.165.123:9872/hg19.1/wgEncodeSydhTfbsGm12878Pol2s2IggmusSig.bigWig.bedGraph.genome.sorted.gz",
        "type": "top-line",
        "height": 45
      },

      {
        "source": "//52.23.165.123:9872/hg19.1/E116-DNase.fc.signal.bigwig.bedGraph.genome.sorted.gz",
        "type": "top-line",
        "height": 45
      },

      {
        "source": "//52.23.165.123:9872/hg19.1/wgEncodeSydhTfbsGm12878Ctcfsc15914c20StdSig.bigWig.bedGraph.genome.sorted.gz",
        "type": "top-bar",
        "height": 45
      }
    ],
    "zoomLock" : 0
  }
]
`)

try {
ReactDOM.render(
        <HiGlassApp viewConfigString={JSON.stringify(oneDOneWindow)}/>
    , document.getElementById('one-dimensional')
    );
} catch (e) {
   console.log('error:', e); 
}

try {
ReactDOM.render(
        <HiGlassApp viewConfigString={JSON.stringify(oneDOneWindow)}/>
    , document.getElementById('empty')
    );
} catch (e) {
    console.log('error:', e);
}
