var remoteServer = "//higlass.io/api/v1";
var localServer = "/api/v1";
//var usedServer = localServer;
var usedServer = remoteServer;

export const testViewConfig = 
{
  "editable": true,
  "zoomFixed": false,
  "trackSourceServers": [
    "http://127.0.0.1:8000/api/v1"
  ],
  "exportViewUrl": "/api/v1/viewconfs/",
  "views": [
    {
      "uid": "aa",
      "initialXDomain": [
        237061105.78003678,
        273365002.38505375
      ],
      "autocompleteSource": "//higlass.io/api/v1/suggest/?d=dd&",
      "genomePositionSearchBoxVisible": false,
      "tracks": {
        "top": [
          {
            "server": "http://127.0.0.1:8000/api/v1",
            "tilesetUid": "bb",
            "type": "horizontal-line",
            "options": {
              "axisPositionHorizontal": "left",
              "name": "wgEncodeCaltechRnaSeqHuvecR1x75dTh1014IlnaPlusSignalRep2.hitile"
            },
            "height": 20,
            "position": "top",
            "uid": "ZZdrUBIjToi5sJgk7ishPA",
            "name": "wgEncodeCaltechRnaSeqHuvecR1x75dTh1014IlnaPlusSignalRep2.hitile",
            "maxWidth": 4294967296,
            "maxZoom": 22
          }
        ],
        "left": [],
        "center": [
          {
            "uid": "c1",
            "type": "combined",
            "height": 200,
            "contents": [
              {
                "uid": "hm1",
                "server": "http://127.0.0.1:8000/api/v1",
                "tilesetUid": "aa",
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
                  "name": "dixon2012-h1hesc-hindiii-allreps-filtered.1000kb.multires.cool"
                },
                "name": "dixon2012-h1hesc-hindiii-allreps-filtered.1000kb.multires.cool",
                "maxWidth": 4096000000,
                "binsPerDimension": 256,
                "maxZoom": 4
              },
              {
                "uuid": "aa",
                "filetype": "cooler",
                "datatype": "matrix",
                "private": false,
                "name": "dixon2012-h1hesc-hindiii-allreps-filtered.1000kb.multires.cool",
                "coordSystem": "hg19",
                "coordSystem2": "",
                "server": "http://127.0.0.1:8000/api/v1",
                "tilesetUid": "aa",
                "serverUidKey": "http://127.0.0.1:8000/api/v1/aa",
                "uid": "byOWlwyeTi6ncvwD8RM_hQ",
                "type": "2d-tiles",
                "options": {
                  "name": "dixon2012-h1hesc-hindiii-allreps-filtered.1000kb.multires.cool"
                },
                "maxWidth": 4096000000,
                "binsPerDimension": 256,
                "maxZoom": 4
              }
            ],
            "position": "center",
            "options": {}
          }
        ],
        "right": [],
        "bottom": []
      },
      "initialYDomain": [
        236407397.02457654,
        265029240.4230712
      ],
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

export const testViewConfig1 = {
  "editable": true,
  "zoomFixed": false,
  "trackSourceServers": [
      remoteServer
  ],
  "exportViewUrl": remoteServer + "/viewconfs/",
  "views": [
    {
      "uid": "aa",
      "layout": {"x": 0, "y": 0, "w": 6, "h": 8},
      "initialXDomain": [
            0,
            3200000000
      ],
      "autocompleteSource": remoteServer + "/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "genomePositionSearchBoxVisible": true,
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "tracks": {
        "top": [
            /*
          {
            "type": "horizontal-gene-annotations",
            "height": 60,
            "tilesetUid": "OHJakQICQD6gTD7skx4EWA",
            "server": remoteServer,
            "position": "top",
            "uid": "OHJakQICQD6gTD7skx4EWA",
            "name": "Gene Annotations",
          }
            ,
            */
          {
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "type": "horizontal-chromosome-labels",
            "position": "top",
            "name": "Chromosome Labels (hg19)"
          }
        ],

        "left": [
            /*
          {
            "type": "vertical-gene-annotations",
            "width": 60,
            "tilesetUid": "OHJakQICQD6gTD7skx4EWA",
            "server": remoteServer,
            "position": "left",
            "name": "Gene Annotations"
          }
            ,
            */
          {
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "type": "vertical-chromosome-labels",
            "position": "top",
            "name": "Chromosome Labels (hg19)"
          }
        ],
        "center": [
          {
            "uid": "c1",
            "type": "combined",
            "height": 200,
            "contents": [
              {
                "server": remoteServer,
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
                  "maxZoom": null
                }
              }
              ,
              {
                  'type': '2d-chromosome-grid',
                  'position': 'center',
                  'chromInfoPath': "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
              }

            ],
            "position": "center"
          }
        ],
        "right": [],
        "bottom": []
      }
    }
  ],
  "zoomLocks": {
    "locksByViewUid": {},
    "zoomLocksDict": {}
  }
};

export const deployViewConfig = {
  "editable": true,
  "zoomFixed": false,
  "trackSourceServers": [
      remoteServer
  ],
  "exportViewUrl": "/api/v1/viewconfs/",
  "views": [
    {
      "uid": "aa",
      "initialXDomain": [
        0,
        3100000000
      ],
      "autocompleteSource": "//higlass.io/api/v1/suggest/?d=dd&",
      "genomePositionSearchBoxVisible": true,
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "tracks": {
        "top": [
          {
            "type": "horizontal-gene-annotations",
            "height": 60,
            "tilesetUid": "dd",
            "server": remoteServer,
            "position": "top",
            "uid": "D00ffLKHSGqwp4r64sSU7A",
            "name": "Gene Annotations",
          },
          {
            "type": "top-axis",
            "height": 60,
            "position": "top",
            "name": "Top Axis",
          }
        ],
        "left": [
          {
            "type": "vertical-gene-annotations",
            "width": 60,
            "tilesetUid": "dd",
            "server": remoteServer,
            "position": "left",
            "uid": "SVYNEiMITAe_K60zCH_7vQ",
            "name": "Gene Annotations",
            "options": {
                "labelPosition": "bottomRight"
            }
          }
        ],
        "center": [
          {
            "uid": "c1",
            "type": "combined",
            "height": 200,
            "contents": [
              {
                "uid": "hm1",
                "server": remoteServer,
                "tilesetUid": "aa",
                "type": "heatmap",
                "position": "center",
                "options": {
                  "colorRange": [
                    "#FFFFFF",
                    "#F8E71C",
                    "#F5A623",
                    "#D0021B"
                  ],
                  "maxZoom": null
                },
                "name": "Dixon2015-H1_TB-HindIII-allreps-filtered.10kb.multires.cool"
              }
            ],
            "position": "center"
          }
        ],
        "right": [],
        "bottom": []
      }
    }
  ],
  "zoomLocks": {
    "locksByViewUid": {},
    "zoomLocksDict": {}
  }
};

export const localViewConfig = {
  "editable": true,
  "zoomFixed": false,
  "trackSourceServers": [
      localServer
  ],
  "exportViewUrl": localServer + "/viewconfs/",
  "views": [
    {
      "uid": "aa",
      "initialXDomain": [
        0,
        3100000000
      ],
      "autocompleteSource": localServer + "/suggest/?d=dd&",
      "genomePositionSearchBoxVisible": true,
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "tracks": {
        "top": [
          {
            "type": "horizontal-gene-annotations",
            "height": 60,
            "tilesetUid": "dd",
            "server": localServer,
            "position": "top",
            "uid": "D00ffLKHSGqwp4r64sSU7A",
            "name": "Gene Annotations",
          },
          {
            "type": "top-axis",
            "height": 60,
            "position": "top",
            "name": "Top Axis",
          }
        ],
        "left": [
          {
            "type": "vertical-gene-annotations",
            "width": 60,
            "tilesetUid": "dd",
            "server": localServer,
            "position": "left",
            "uid": "SVYNEiMITAe_K60zCH_7vQ",
            "name": "Gene Annotations",
            "options": {
                "labelPosition": "bottomRight"
            }
          }
        ],
        "center": [
          {
            "uid": "c1",
            "type": "combined",
            "height": 200,
            "contents": [
              {
                "uid": "hm1",
                "server": localServer,
                "tilesetUid": "aa",
                "type": "heatmap",
                "position": "center",
                "options": {
                  "colorRange": [
                    "#FFFFFF",
                    "#F8E71C",
                    "#F5A623",
                    "#D0021B"
                  ],
                  "maxZoom": null
                },
                "name": "Dixon2015-H1_TB-HindIII-allreps-filtered.10kb.multires.cool"
              }
            ],
            "position": "center"
          }
        ],
        "right": [],
        "bottom": []
      }
    }
  ],
  "zoomLocks": {
    "locksByViewUid": {},
    "zoomLocksDict": {}
  }
};

export const defaultViewConfig = {
  "editable": true,
  "zoomFixed": false,
  "trackSourceServers": [
      "/api/v1"
  ],
  "exportViewUrl": localServer + "/viewconfs/",
  "views": [
    {
      "uid": "aa",
      "initialXDomain": [
        0,
        3100000000
      ],
      "autocompleteSource": "/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "genomePositionSearchBoxVisible": true,
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "tracks": {
        "top": [
          {
            "type": "horizontal-gene-annotations",
            "height": 60,
            "tilesetUid": "OHJakQICQD6gTD7skx4EWA",
            "server": "/api/v1",
            "position": "top",
            "uid": "OHJakQICQD6gTD7skx4EWA",
            "name": "Gene Annotations",
          }
            ,
          {
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "type": "horizontal-chromosome-labels",
            "position": "top",
            "name": "Chromosome Labels (hg19)"
          }
        ],
        "left": [
          {
            "type": "vertical-gene-annotations",
            "width": 60,
            "tilesetUid": "OHJakQICQD6gTD7skx4EWA",
            "server": "/api/v1",
            "position": "left",
            "name": "Gene Annotations",
            "options": {
                "labelPosition": "bottomRight"
            }
          }
            ,
          {
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "type": "vertical-chromosome-labels",
            "position": "top",
            "name": "Chromosome Labels (hg19)"
          }
        ],
        "center": [
          {
            "uid": "c1",
            "type": "combined",
            "height": 200,
            "contents": [
              {
                "server": "/api/v1",
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
                  "maxZoom": null
                }
              }
            ],
            "position": "center"
          }
        ],
        "right": [],
        "bottom": []
      }
    }
  ],
  "zoomLocks": {
    "locksByViewUid": {},
    "zoomLocksDict": {}
  }
};
