import React from 'react';
import ReactDOM from 'react-dom';
import {HiGlassApp} from './HiGlassApp.js';
import $ from 'jquery';

let simple1 = JSON.parse(`
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
                "zoomLock" : 0,
                "searchBox": false
            }
            ],
            "editable": false
        }
`);

let rectangularOneWindow = JSON.parse(`
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
                "zoomLock" : 0,
                "searchBox": true
            }
            ],
            "editable": true
                }
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
                "zoomLock" : 0,
                "searchBox" : true
            }
            ],
            "editable": true
        }
`)
let triangularTwoWindow = JSON.stringify({
        views: triangularOneWindow.views.concat(triangularOneWindow.views),
        editable: true 
        }, null, 2);


try {
ReactDOM.render(
        <HiGlassApp viewConfigString={triangularTwoWindow}/>
    , document.getElementById('triangular-1')
    );
} catch (e) {
    console.log('Error:', e);
}

let oneDOneWindow = JSON.parse(`
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
                "zoomLock" : 0,
                "searchBox" : true
            }
            ], 
            "editable": true
        }
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

try {
ReactDOM.render(
        <HiGlassApp viewConfigString={JSON.stringify(simple1)}/>
    , document.getElementById('simple1')
    );
} catch (e) {
    console.log('error:', e);
}

let zoomableBar = JSON.parse(`
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
                    "source": "//52.23.165.123:9872/hg19.1/wgEncodeSydhTfbsGm12878Pol2s2IggmusSig.bigWig.bedGraph.genome.sorted.gz",
                    "type": "top-bar",
                    "height": 25
                }

                ]
            }
            ],
            "editable": false
        }
`);

try {
ReactDOM.render(
        <HiGlassApp viewConfigString={JSON.stringify(zoomableBar)}/>
    , document.getElementById('zoomable-bar')
    );
} catch (e) {
    console.log('error:', e);
}


let zoomableLine = JSON.parse(`
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
                    "source": "//52.23.165.123:9872/hg19.1/wgEncodeSydhTfbsGm12878Pol2s2IggmusSig.bigWig.bedGraph.genome.sorted.gz",
                    "type": "top-line",
                    "height": 25
                }

                ]
            }
            ],
            "editable": false
        }
`);

try {
ReactDOM.render(
        <HiGlassApp viewConfigString={JSON.stringify(zoomableLine)} />
    , document.getElementById('zoomable-line')
    );
} catch (e) {
    console.log('error:', e);
}

let zoomableGenes = JSON.parse(`
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
                    "source": "//52.23.165.123:9872/hg19/refgene-tiles-plus",
                    "type": "top-gene-labels",
                    "height": 25
                },
                {
                    "source": "//52.23.165.123:9872/hg19/refgene-tiles-minus",
                    "type": "top-gene-labels",
                    "height": 25
                }

                ]
            }
            ],
            "editable": false
        }
`);

try {
ReactDOM.render(
        <HiGlassApp viewConfigString={JSON.stringify(zoomableGenes)}/>
    , document.getElementById('zoomable-genes')
    );
} catch (e) {
    console.log('error:', e);
}

let zoomableEverything = JSON.parse(`
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
                    "type": "top-chromosome-axis",
                    "height": 25
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
                    "source": "//52.23.165.123:9872/hg19.1/wgEncodeSydhTfbsGm12878Ctcfsc15914c20StdSig.bigWig.bedGraph.genome.sorted.gz",
                    "type": "top-bar",
                    "height": 45
                }

                ]
            }
            ],
            "editable": false
        }
`);

try {
ReactDOM.render(
        <HiGlassApp viewConfigString={JSON.stringify(zoomableEverything)}/>
    , document.getElementById('zoomable-everything')
    );
} catch (e) {
    console.log('error:', e);
}

let normalizationDemo = JSON.parse(`

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
      "width": "50%"
    },
    "tracks": [
      {
        "source": "//52.23.165.123:9872/hg19/Dixon2015-H1_hESC-HindIII-allreps-filtered.50kb.cool.unbalanced.genome.sorted.gz",
        "type": "top-diagonal-heatmap",
        "height": 200
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
    "zoomLock": 0,
    "searchBox": true
  },
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
        "source": "//52.23.165.123:9872/hg19/Dixon2015-H1_hESC-HindIII-allreps-filtered.50kb.cool.genome.sorted.gz",
        "type": "top-diagonal-heatmap",
        "height": 200
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
    "zoomLock": 0,
    "searchBox": true
  }
],
"editable": true

}
`);

let gridDemo = JSON.parse(`
{
 "views": [
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
        "source": "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
        "type": "top-chromosome-axis",
        "height": 25
      },
      {
        "source": "//54.197.186.181:9872/hg19.1/hg19.read_length_16.reads_1000000.dups_100.res_256.contacts.genome",
        "type": "heatmap"
      },
      {
        "source": "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
        "type": "left-chromosome-axis",
        "width": 25
      },
      {
        "type": "left-empty",
        "width": 5
      }
    ],
    "zoomLock": 0
  },
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
        "source": "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
        "type": "top-chromosome-axis",
        "height": 25
      },
      {
        "source": "//54.197.186.181:9872/hg19.1/hg19.read_length_32.reads_1000000.dups_100.res_256.contacts.genome",
        "type": "heatmap"
      },
      {
        "source": "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
        "type": "left-chromosome-axis",
        "width": 25
      },
      {
        "type": "left-empty",
        "width": 5
      }
    ],
    "zoomLock": 0
  },
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
        "source": "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
        "type": "top-chromosome-axis",
        "height": 25
      },
      {
        "source": "//54.197.186.181:9872/hg19.1/hg19.read_length_64.reads_1000000.dups_100.res_256.contacts.genome",
        "type": "heatmap"
      },
      {
        "source": "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
        "type": "left-chromosome-axis",
        "width": 25
      },
      {
        "type": "left-empty",
        "width": 5
      }
    ],
    "zoomLock": 0
  },
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
        "source": "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
        "type": "top-chromosome-axis",
        "height": 25
      },
      {
        "source": "//54.197.186.181:9872/hg19.1/hg19.read_length_128.reads_1000000.dups_100.res_256.contacts.genome",
        "type": "heatmap"
      },
      {
        "source": "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
        "type": "left-chromosome-axis",
        "width": 25
      },
      {
        "type": "left-empty",
        "width": 5
      }
    ],
    "zoomLock": 0
  }
],
"editable": true
}

`);


try {
ReactDOM.render(
    <HiGlassApp viewConfigString={JSON.stringify(normalizationDemo)}/>
    //<HiGlassApp viewConfigString={JSON.stringify(rectangularOneWindow)}/>
    , document.getElementById('comparison-demo')
    );
} catch (e) {
    console.log('error:', e);
}

let developmentDemo = JSON.parse(`
        {
   "views":[
      {
         "chromInfoPath":"//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
         "domain":[
            0,
            3000000000
         ],
         "viewStyle":{
            "float":"left",
            "padding":"5px",
            "width":"100%"
         },
         "tracks":[
             {
          "source": "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
          "type": "top-chromosome-axis"
        },
            {
               "source":"//54.197.186.181:9872/hg19.1/hg19.read_length_16.reads_2000000.dups_100.res_256.contacts.genome",
               "type":"heatmap"
            },
            {
               "source":"//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
               "type":"left-chromosome-axis",
               "width":25
            }
         ],
         "searchBox": true,
         "zoomLock":0
      }
   ],
   "editable":true
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
