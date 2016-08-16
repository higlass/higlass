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
        "source": "//52.23.165.123:9872/hg19.1/Rao2014-GM12878-MboI-allreps-filtered.1kb.cool.reduced.genome.gz",
        "type": "heatmap",
        "height": 400
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
ReactDOM.render(
        <HiGlassApp viewConfigString={JSON.stringify(rectangularOneWindow)}/>
    , document.getElementById('rectangular')
    );

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


ReactDOM.render(
        <HiGlassApp viewConfigString={triangularTwoWindow}/>
    , document.getElementById('triangular-1')
    );

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
        "height": 25
      },

      {
        "source": "//52.23.165.123:9872/hg19.1/E116-DNase.fc.signal.bigwig.bedGraph.genome.sorted.gz",
        "type": "top-line",
        "height": 25
      },

      {
        "source": "//52.23.165.123:9872/hg19.1/wgEncodeSydhTfbsGm12878Ctcfsc15914c20StdSig.bigWig.bedGraph.genome.sorted.gz",
        "type": "top-bar",
        "height": 25
      }
    ],
    "zoomLock" : 0
  }
]
`)

ReactDOM.render(
        <HiGlassApp viewConfigString={JSON.stringify(oneDOneWindow)}/>
    , document.getElementById('one-dimensional')
    );
