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
                0,3000000000
                                          ],
            "initialYDomain": [
                0,3000000000
                                          ],
      "autocompleteSource": "http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "genomePositionSearchBoxVisible": true,
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "tracks": {
        "top": [
                  {
            "uuid": "OHJakQICQD6gTD7skx4EWA",
            "filetype": "beddb",
            "datatype": "gene-annotation",
            "private": false,
            "name": "Gene Annotations (hg19)",
            "coordSystem": "hg19",
            "coordSystem2": "",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "OHJakQICQD6gTD7skx4EWA",
            "serverUidKey": "http://higlass.io/api/v1/OHJakQICQD6gTD7skx4EWA",
            "uid": "BEEMEjU7QCa2krDO9C0yOQ",
            "type": "horizontal-gene-annotations",
            "options": {
                "labelPosition": "outerTop",
              "name": "Gene Annotations (hg19)"
            },
            "width": 20,
            "height": 60,
            "maxWidth": 4294967296,
            "maxZoom": 22
          },
         {
            "filetype": "hitile",
            "datatype": "vector",
            "private": false,
            "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
            "coordSystem": "hg19",
            "coordSystem2": "",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "F2vbUeqhS86XkxuO1j2rPA",
            "serverUidKey": "http://higlass.io/api/v1/F2vbUeqhS86XkxuO1j2rPA",
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
            "maxZoom": 22
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
              "valueScaling": "log"
            }
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
              "name": "Gene Annotations (hg19)"
            },
            "uid": "OgnAEKSHRaG-gR1RqPOuBQ",
            "maxWidth": 4294967296,
            "maxZoom": 22
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
          {
            "type": "vertical-gene-annotations",
            "width": 60,
            "tilesetUid": "OHJakQICQD6gTD7skx4EWA",
            "server": "http://higlass.io/api/v1",
            "name": "Gene Annotations (hg19)",
            "options": {
              "labelPosition": "outerBottom",
              "name": "Gene Annotations (hg19)"
            },
            "maxWidth": 4294967296,
            "maxZoom": 22
          },
          {
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "type": "vertical-chromosome-labels",
            "name": "Chromosome Labels (hg19)",
            "width": 30,
            "options": {
                "labelPosition": "outerBottom",
                "name": "Chromosome labels"
            }
          }
        ],
        "bottom": [
         {
            "filetype": "hitile",
            "datatype": "vector",
            "private": false,
            "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
            "coordSystem": "hg19",
            "coordSystem2": "",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "F2vbUeqhS86XkxuO1j2rPA",
            "serverUidKey": "http://higlass.io/api/v1/F2vbUeqhS86XkxuO1j2rPA",
            "type": "horizontal-line",
            "options": {
              "labelPosition": "outerLeft",
              "axisPositionHorizontal": "right",
              "lineStrokeColor": "blue",
              "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
              "valueScaling": "log"
            },
            "width": 20,
            "height": 50,
            "maxWidth": 4294967296,
            "maxZoom": 22
          },
        ]
      },
      "layout": {
        "w": 12,
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

describe("<HiGlassComponent />", () => {
    const hgc = mount(<HiGlassComponent viewConfig={testViewConfig} />);

    it ('exports SVG', () => {
        console.log('hgc:', hgc.instance().tiledPlot);
    })
});
