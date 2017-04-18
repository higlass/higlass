import { mount } from 'enzyme';
import { expect } from 'chai';
import React from 'react';
import {HiGlassComponent} from '../app/scripts/HiGlassComponent.jsx';

let testViewConfig = 
{
  "editable": true,
  "zoomFixed": false,
  "trackSourceServers": [
    "http://higlass.io/api/v1"
  ],
  "exportViewUrl": "http://higlass.io/api/v1/viewconfs/",
  "views": [
    {
      "uid": "aa",
      "initialXDomain": [
        957648546.1441214,
        2042351453.8558786
      ],
      "initialYDomain": [
        -26548672.566371918,
        3026548672.566372
      ],
      "autocompleteSource": "http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "genomePositionSearchBoxVisible": true,
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "tracks": {
        "top": [
          {
            "filetype": "beddb",
            "name": "Gene Annotations (hg19)",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "OHJakQICQD6gTD7skx4EWA",
            "uid": "BEEMEjU7QCa2krDO9C0yOQ",
            "type": "horizontal-gene-annotations",
            "options": {
              "labelPosition": "outerTop",
              "name": "Gene Annotations (hg19)",
              "labelColor": "black",
              "plusStrandColor": "blue",
              "minusStrandColor": "red"
            },
            "width": 20,
            "height": 60,
            "maxWidth": 4294967296,
            "position": "top"
          },
          {
            "filetype": "hitile",
            "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "F2vbUeqhS86XkxuO1j2rPA",
            "type": "horizontal-line",
            "options": {
              "labelColor": "red",
              "labelPosition": "outerLeft",
              "axisPositionHorizontal": "right",
              "lineStrokeColor": "blue",
              "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
              "valueScaling": "log"
            },
            "width": 20,
            "height": 20,
            "maxWidth": 4294967296,
            "position": "top",
            "uid": "line1"
          },
          {
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "type": "horizontal-chromosome-labels",
            "position": "top",
            "name": "Chromosome Labels (hg19)",
            "height": 30,
            "uid": "I1QUF22JQJuJ38j9PS4iqw",
            "options": {}
          }
        ],
        "left": [
          {
            "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "F2vbUeqhS86XkxuO1j2rPA",
            "type": "vertical-line",
            "options": {
              "labelColor": "red",
              "labelPosition": "outerLeft",
              "axisPositionHorizontal": "right",
              "lineStrokeColor": "blue",
              "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
              "valueScaling": "log",
              "axisPositionVertical": "top"
            },
            "width": 20,
            "position": "left",
            "uid": "SmDGhBndRfSy5r7wGsbtOQ",
            "maxWidth": 4294967296
          },
          {
            "type": "vertical-gene-annotations",
            "width": 60,
            "tilesetUid": "OHJakQICQD6gTD7skx4EWA",
            "server": "http://higlass.io/api/v1",
            "position": "left",
            "name": "Gene Annotations (hg19)",
            "options": {
              "labelPosition": "bottomRight",
              "name": "Gene Annotations (hg19)",
              "labelColor": "black",
              "plusStrandColor": "blue",
              "minusStrandColor": "red"
            },
            "uid": "OgnAEKSHRaG-gR1RqPOuBQ",
            "maxWidth": 4294967296
          },
          {
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "type": "vertical-chromosome-labels",
            "position": "left",
            "name": "Chromosome Labels (hg19)",
            "width": 30,
            "uid": "a-mFiHnBQ8uuI6UG3USWVA",
            "options": {}
          }
        ],
        "center": [
          {
            "uid": "c1",
            "type": "combined",
            "height": 200,
            "contents": [
              {
                "server": "http://higlass.io/api/v1",
                "tilesetUid": "CQMd6V_cRw6iCI_-Unl3PQ",
                "type": "heatmap",
                "position": "center",
                "options": {
                  "colorRange": [
                    "#FFFFFF",
                    "#F8E71C",
                    "#F5A623",
                    "#D0021B"
                  ],
                  "maxZoom": null,
                  "labelPosition": "bottomRight",
                  "name": "Rao et al. (2014) GM12878 MboI (allreps) 1kb"
                },
                "uid": "Ou4CIWdfSOqAucehIgPwgA",
                "name": "Rao et al. (2014) GM12878 MboI (allreps) 1kb",
                "maxWidth": 4194304000,
                "binsPerDimension": 256
              },
              {
                "type": "2d-chromosome-grid",
                "local": true,
                "orientation": "2d",
                "name": "Chromosome Grid (hg19)",
                "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
                "thumbnail": null,
                "server": "",
                "tilesetUid": "TIlwFtqxTX-ndtM7Y9k1bw",
                "uid": "LUVqXXu2QYiO8XURIwyUyA",
                "options": {
                  "gridStrokeWidth": 1,
                  "gridStrokeColor": "grey"
                },
                "position": "center"
              }
            ],
            "position": "center",
            "options": {}
          }
        ],
        "right": [
          {
            "type": "vertical-gene-annotations",
            "width": 60,
            "tilesetUid": "OHJakQICQD6gTD7skx4EWA",
            "server": "http://higlass.io/api/v1",
            "name": "Gene Annotations (hg19)",
            "options": {
              "labelPosition": "outerBottom",
              "name": "Gene Annotations (hg19)",
              "labelColor": "black",
              "plusStrandColor": "blue",
              "minusStrandColor": "red"
            },
            "maxWidth": 4294967296,
            "position": "right",
            "uid": "eA4fKV3TTRakcyQObAxB2Q"
          },
          {
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "type": "vertical-chromosome-labels",
            "name": "Chromosome Labels (hg19)",
            "width": 30,
            "options": {
              "labelPosition": "outerBottom",
              "name": "Chromosome labels"
            },
            "position": "right",
            "uid": "SR0Gy7xdSkugTYqa83sRbw"
          }
        ],
        "bottom": [
          {
            "filetype": "hitile",
            "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "F2vbUeqhS86XkxuO1j2rPA",
            "type": "horizontal-line",
            "options": {
              "labelPosition": "outerLeft",
              "axisPositionHorizontal": "right",
              "lineStrokeColor": "blue",
              "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
              "valueScaling": "log",
              "labelColor": "black"
            },
            "width": 20,
            "height": 50,
            "maxWidth": 4294967296,
            "position": "bottom",
            "uid": "dGISI6gMTM6t67RZdcJAYA"
          }
        ]
      },
      "layout": {
        "w": 6,
        "h": 12,
        "x": 0,
        "y": 0,
        "i": "aa",
        "moved": false,
        "static": false
      }
    },
    {
      "uid": "ArT4UIcsRNC89-D568idog",
      "initialXDomain": [
        957648546.1441212,
        2042351453.8558784
      ],
      "initialYDomain": [
        -26548672.56637156,
        3026548672.5663714
      ],
      "autocompleteSource": "http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "genomePositionSearchBoxVisible": true,
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "tracks": {
        "top": [
          {
            "filetype": "beddb",
            "name": "Gene Annotations (hg19)",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "OHJakQICQD6gTD7skx4EWA",
            "uid": "BEEMEjU7QCa2krDO9C0yOQ",
            "type": "horizontal-gene-annotations",
            "options": {
              "labelPosition": "outerTop",
              "name": "Gene Annotations (hg19)",
              "labelColor": "black",
              "plusStrandColor": "blue",
              "minusStrandColor": "red"
            },
            "width": 20,
            "height": 60,
            "maxWidth": 4294967296,
            "position": "top"
          },
          {
            "filetype": "hitile",
            "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "F2vbUeqhS86XkxuO1j2rPA",
            "type": "horizontal-line",
            "options": {
              "labelColor": "red",
              "labelPosition": "outerLeft",
              "axisPositionHorizontal": "right",
              "lineStrokeColor": "blue",
              "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
              "valueScaling": "log"
            },
            "width": 20,
            "height": 20,
            "maxWidth": 4294967296,
            "position": "top",
            "uid": "HcvmtDwuR5i99XGz-rjVxA"
          },
          {
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "type": "horizontal-chromosome-labels",
            "position": "top",
            "name": "Chromosome Labels (hg19)",
            "height": 30,
            "uid": "I1QUF22JQJuJ38j9PS4iqw",
            "options": {}
          }
        ],
        "left": [
          {
            "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "F2vbUeqhS86XkxuO1j2rPA",
            "type": "vertical-line",
            "options": {
              "labelColor": "red",
              "labelPosition": "outerLeft",
              "axisPositionHorizontal": "right",
              "lineStrokeColor": "blue",
              "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
              "valueScaling": "log",
              "axisPositionVertical": "top"
            },
            "width": 20,
            "position": "left",
            "uid": "SmDGhBndRfSy5r7wGsbtOQ",
            "maxWidth": 4294967296
          },
          {
            "type": "vertical-gene-annotations",
            "width": 60,
            "tilesetUid": "OHJakQICQD6gTD7skx4EWA",
            "server": "http://higlass.io/api/v1",
            "position": "left",
            "name": "Gene Annotations (hg19)",
            "options": {
              "labelPosition": "bottomRight",
              "name": "Gene Annotations (hg19)",
              "labelColor": "black",
              "plusStrandColor": "blue",
              "minusStrandColor": "red"
            },
            "uid": "OgnAEKSHRaG-gR1RqPOuBQ",
            "maxWidth": 4294967296
          },
          {
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "type": "vertical-chromosome-labels",
            "position": "left",
            "name": "Chromosome Labels (hg19)",
            "width": 30,
            "uid": "a-mFiHnBQ8uuI6UG3USWVA",
            "options": {}
          }
        ],
        "center": [
          {
            "uid": "c1",
            "type": "combined",
            "height": 200,
            "contents": [
              {
                "server": "http://higlass.io/api/v1",
                "tilesetUid": "CQMd6V_cRw6iCI_-Unl3PQ",
                "type": "heatmap",
                "position": "center",
                "options": {
                  "colorRange": [
                    "#FFFFFF",
                    "#F8E71C",
                    "#F5A623",
                    "#D0021B"
                  ],
                  "maxZoom": null,
                  "labelPosition": "bottomRight",
                  "name": "Rao et al. (2014) GM12878 MboI (allreps) 1kb"
                },
                "uid": "Ou4CIWdfSOqAucehIgPwgA",
                "name": "Rao et al. (2014) GM12878 MboI (allreps) 1kb",
                "maxWidth": 4194304000,
                "binsPerDimension": 256
              },
              {
                "type": "2d-chromosome-grid",
                "local": true,
                "orientation": "2d",
                "name": "Chromosome Grid (hg19)",
                "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
                "thumbnail": null,
                "server": "",
                "tilesetUid": "TIlwFtqxTX-ndtM7Y9k1bw",
                "uid": "LUVqXXu2QYiO8XURIwyUyA",
                "options": {
                  "gridStrokeWidth": 1,
                  "gridStrokeColor": "grey"
                },
                "position": "center"
              }
            ],
            "position": "center",
            "options": {}
          }
        ],
        "right": [
          {
            "type": "vertical-gene-annotations",
            "width": 60,
            "tilesetUid": "OHJakQICQD6gTD7skx4EWA",
            "server": "http://higlass.io/api/v1",
            "name": "Gene Annotations (hg19)",
            "options": {
              "labelPosition": "outerBottom",
              "name": "Gene Annotations (hg19)",
              "labelColor": "black",
              "plusStrandColor": "blue",
              "minusStrandColor": "red"
            },
            "maxWidth": 4294967296,
            "position": "right",
            "uid": "eA4fKV3TTRakcyQObAxB2Q"
          },
          {
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "type": "vertical-chromosome-labels",
            "name": "Chromosome Labels (hg19)",
            "width": 30,
            "options": {
              "labelPosition": "outerBottom",
              "name": "Chromosome labels"
            },
            "position": "right",
            "uid": "SR0Gy7xdSkugTYqa83sRbw"
          }
        ],
        "bottom": [
          {
            "filetype": "hitile",
            "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "F2vbUeqhS86XkxuO1j2rPA",
            "type": "horizontal-line",
            "options": {
              "labelPosition": "outerLeft",
              "axisPositionHorizontal": "right",
              "lineStrokeColor": "blue",
              "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
              "valueScaling": "log",
              "labelColor": "black"
            },
            "width": 20,
            "height": 50,
            "maxWidth": 4294967296,
            "position": "bottom",
            "uid": "dGISI6gMTM6t67RZdcJAYA"
          }
        ]
      },
      "layout": {
        "w": 6,
        "h": 12,
        "x": 6,
        "y": 0,
        "i": "ArT4UIcsRNC89-D568idog",
        "moved": false,
        "static": false
      }
    }
  ],
  "zoomLocks": {
    "locksByViewUid": {},
    "locksDict": {}
  },
  "locationLocks": {
    "locksByViewUid": {},
    "locksDict": {}
  }
}

let testViewConfig2 = 
{
  "editable": true,
  "zoomFixed": false,
  "trackSourceServers": [
    "http://higlass.io/api/v1"
  ],
  "exportViewUrl": "http://higlass.io/api/v1/viewconfs/",
  "views": [
    {
      "uid": "aa",
      "initialXDomain": [
        957648546.1441214,
        2042351453.8558786
      ],
      "initialYDomain": [
        -26548672.566371918,
        3026548672.566372
      ],
      "autocompleteSource": "http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "genomePositionSearchBoxVisible": true,
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "tracks": {
        "top": [
          {
            "filetype": "hitile",
            "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "F2vbUeqhS86XkxuO1j2rPA",
            "type": "horizontal-line",
            "options": {
              "labelColor": "red",
              "labelPosition": "outerLeft",
              "axisPositionHorizontal": "right",
              "lineStrokeColor": "blue",
              "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
              "valueScaling": "log"
            },
            "width": 20,
            "height": 20,
            "maxWidth": 4294967296,
            "position": "top",
            "uid": "line1"
          }
        ],
        "left": [
          {
            "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "F2vbUeqhS86XkxuO1j2rPA",
            "type": "vertical-line",
            "options": {
              "labelColor": "red",
              "labelPosition": "outerLeft",
              "axisPositionHorizontal": "right",
              "lineStrokeColor": "blue",
              "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
              "valueScaling": "log",
              "axisPositionVertical": "top"
            },
            "width": 20,
            "position": "left",
            "uid": "SmDGhBndRfSy5r7wGsbtOQ",
            "maxWidth": 4294967296
          }
        ],
        "center": [
          {
            "uid": "c1",
            "type": "combined",
            "height": 200,
            "contents": [
              {
                "server": "http://higlass.io/api/v1",
                "tilesetUid": "CQMd6V_cRw6iCI_-Unl3PQ",
                "type": "heatmap",
                "position": "center",
                "options": {
                  "colorRange": [
                    "#FFFFFF",
                    "#F8E71C",
                    "#F5A623",
                    "#D0021B"
                  ],
                  "colorbarPosition": "topLeft",
                  "colorbarOrientation": "vertical",
                  "colorbarLabelsPosition": "outside",
                  "maxZoom": null,
                  "labelPosition": "bottomRight",
                  "name": "Rao et al. (2014) GM12878 MboI (allreps) 1kb"
                },
                "uid": "heatmap1",
                "name": "Rao et al. (2014) GM12878 MboI (allreps) 1kb",
                "maxWidth": 4194304000,
                "binsPerDimension": 256,
                "maxZoom": 14
              },
              {
                "type": "2d-chromosome-grid",
                "datatype": [
                  "chromosome-2d-grid"
                ],
                "local": true,
                "orientation": "2d",
                "name": "Chromosome Grid (hg19)",
                "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
                "thumbnail": null,
                "uuid": "TIlwFtqxTX-ndtM7Y9k1bw",
                "server": "",
                "tilesetUid": "TIlwFtqxTX-ndtM7Y9k1bw",
                "serverUidKey": "/TIlwFtqxTX-ndtM7Y9k1bw",
                "uid": "LUVqXXu2QYiO8XURIwyUyA",
                "options": {}
              }

            ],
            "position": "center",
            "options": {}
          }
        ],
        "right": [
        ],
        "bottom": [
        ]
      },
      "layout": {
        "w": 6,
        "h": 12,
        "x": 0,
        "y": 0,
        "i": "aa",
        "moved": false,
        "static": false
      }
    }
  ],
  "zoomLocks": {
    "locksByViewUid": {},
    "locksDict": {}
  },
  "locationLocks": {
    "locksByViewUid": {},
    "locksDict": {}
  }
}

const pageLoadTime = 1500;

function testAsync(done) {
    // Wait two seconds, then set the flag to true
    setTimeout(function () {
        //flag = true;

        // Invoke the special done callback
        console.log('done:', done);
        done();
    }, pageLoadTime);
}

/*
describe("<HiGlassComponent />", () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    div.setAttribute('style', 'height:800px; width:800px');

    const hgc = mount(<HiGlassComponent 
                        options={{bounded: true}}
                        viewConfig={testViewConfig}
                      />, 
            {attachTo: div});


    // wait a bit of time for the data to be loaded from the server
    beforeAll((done) => {
        testAsync(done);
    });

    describe("page has loaded", () => {
        it ('exports SVG', () => {
            let svg = hgc.instance().createSVG();
            let svgText = new XMLSerializer().serializeToString(svg);

            expect(svgText.indexOf('Chromosome2DGrid')).to.be.above(0);
            expect(svgText.indexOf('HorizontalChromosomeLabels')).to.be.above(0);
            hgc.instance().handleExportSVG();
            
            //
            //console.log('svg', svg);
            let line1 = hgc.instance().tiledPlots['aa'].trackRenderer.trackDefObjects['line1'].trackObject;

            let axis = line1.exportAxisRightSVG(line1.valueScale, line1.dimensions[1]);
            let axisText = new XMLSerializer().serializeToString(axis);
            console.log('axisText:', axisText);
            //let axis = svg.getElementById('axis');
            // make sure we have a tick mark for 200000
            expect(axisText.indexOf('200000')).to.be.above(0);

            // position of the axis
            expect(axisText.indexOf('175')).to.be.above(0);
            expect(axisText.indexOf('146')).to.be.above(0);
        })

        it ('does something else', () => {
            //hgc.instance().handleExportSVG(); 
        });

        if ('does one more thing', () => {

        });
    })
});
*/

describe("Simple HiGlassComponent", () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    div.setAttribute('style', 'height:800px; width:800px');

    let hgc = mount(<HiGlassComponent 
                        options={{bounded: true}}
                        viewConfig={testViewConfig2}
                      />, 
            {attachTo: div});


    // wait a bit of time for the data to be loaded from the server

    describe("Single view", () => {
        beforeAll((done) => {
            testAsync(done);
        });

        it ('exports SVG', () => {
            let svg = hgc.instance().createSVG();
            let svgText = new XMLSerializer().serializeToString(svg);
            console.log('svg:', svg);

            //hgc.instance().handleExportSVG();

            // Make sure we have an offset axis
            expect(svgText.indexOf('id="axis" transform="translate(390, 68)"')).to.be.above(0);
            
            //console.log('svg', svg);
            let tdo = hgc.instance().tiledPlots['aa'].trackRenderer.trackDefObjects;
            console.log('tdo:', tdo);

            let line1 = hgc.instance().tiledPlots['aa'].trackRenderer.trackDefObjects['line1'].trackObject;

            let axis = line1.axis.exportAxisRightSVG(line1.valueScale, line1.dimensions[1]);
            let axisText = new XMLSerializer().serializeToString(axis);
            console.log('axis:', axis);

            //console.log('axisText:', axisText);
            //let axis = svg.getElementById('axis');
            // make sure we have a tick mark for 200000
            expect(axisText.indexOf('3e+6')).to.be.above(0);
        })

        it ('has a colorbar', () => {
            let heatmap = hgc.instance().tiledPlots['aa'].trackRenderer
                .trackDefObjects['c1'].trackObject.createdTracks['heatmap1'];
            console.log('heatmap:', heatmap);
            expect(heatmap.pColorbarArea.x).to.be.below(heatmap.dimensions[0] / 2);

            // make sure the labels are drawn on the outside
            expect(heatmap.axis.pAxis.getBounds().x).to.be.below(heatmap.pColorbar.getBounds().x);
            //hgc.instance().handleExportSVG(); 
        });
    })
});
