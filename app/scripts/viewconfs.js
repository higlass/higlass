var remoteServer = "//higlass.io/api/v1";
var localServer = "/api/v1";
//var usedServer = localServer;
var usedServer = remoteServer;

export const testViewConfig = 
{
  "zoomFixed": false,
  "views": [
    {
      "layout": {
        "w": 6,
        "h": 12,
        "x": 0,
        "y": 0,
        "i": "aa",
        "moved": false,
        "static": false
      },
      "uid": "aa",
      "initialYDomain": [
        696689759.7416406,
        702538548.6940163
      ],
      "autocompleteSource": "http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "initialXDomain": [
        1035841916.8849535,
        1049848725.3793163
      ],
      "tracks": {
        "bottom": [],
        "top": [
          {
            "uid": "A1WsNo4ASmmt_NGr6nOlaQ",
            "height": 30,
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "position": "top",
            "type": "horizontal-chromosome-labels",
            "options": {},
            "name": "Chromosome Labels (hg19)"
          },
          {
            "width": 1560,
            "type": "combined",
            "uid": "ekSaD_uyRcWX4MaVjW8umA",
            "contents": [
              {
                "uuid": "THlpTJEpScel6HNAkOa-Yw",
                "maxWidth": 4194304000,
                "width": 20,
                "datatype": "matrix",
                "binsPerDimension": 256,
                "filetype": "cooler",
                "coordSystem": "hg19",
                "private": false,
                "server": "http://higlass.io/api/v1",
                "tilesetUid": "THlpTJEpScel6HNAkOa-Yw",
                "maxZoom": 14,
                "serverUidKey": "http://higlass.io/api/v1/THlpTJEpScel6HNAkOa-Yw",
                "uid": "aS2lWAXVTtWzMF4vz2Jv8Q",
                "position": "top",
                "height": 50,
                "type": "horizontal-heatmap",
                "options": {
                  "maxZoom": null,
                  "colorRange": [
                    "#FFFFFF",
                    "#F8E71C",
                    "rgba(245,166,35,1)",
                    "rgba(0,0,0,1)"
                  ],
                  "labelPosition": "bottomRight",
                  "name": "Dixon et al. (2015) H1_hESC HindIII (allreps) 1kb"
                },
                "coordSystem2": "",
                "name": "Dixon et al. (2015) H1_hESC HindIII (allreps) 1kb"
              },
              {
                "uuid": "b6qFe7fOSnaX-YkP2kzN1w",
                "maxWidth": 4294967296,
                "datatype": "vector",
                "filetype": "hitile",
                "coordSystem": "hg19",
                "private": false,
                "server": "http://higlass.io/api/v1",
                "tilesetUid": "b6qFe7fOSnaX-YkP2kzN1w",
                "maxZoom": 22,
                "serverUidKey": "http://higlass.io/api/v1/b6qFe7fOSnaX-YkP2kzN1w",
                "uid": "FwskpPhoQKWzPGFhMpD2LQ",
                "type": "horizontal-line",
                "options": {
                  "axisPositionHorizontal": "right",
                  "name": "wgEncodeSydhTfbsGm12878Ctcfsc15914c20StdSig.hitile"
                },
                "coordSystem2": "",
                "name": "wgEncodeSydhTfbsGm12878Ctcfsc15914c20StdSig.hitile",
                "position": "top"
              }
            ],
            "height": 191,
            "position": "top",
            "options": {}
          },
          {
            "uid": "OHJakQICQD6gTD7skx4EWA",
            "maxWidth": 4294967296,
            "tilesetUid": "OHJakQICQD6gTD7skx4EWA",
            "server": "http://higlass.io/api/v1",
            "maxZoom": 22,
            "position": "top",
            "height": 60,
            "type": "horizontal-gene-annotations",
            "options": {
              "name": "Gene Annotations (hg19)"
            },
            "name": "Gene Annotations (hg19)"
          }
        ],
        "right": [],
        "center": [],
        "left": []
      },
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "genomePositionSearchBoxVisible": true
    }
  ],
  "editable": true,
  "exportViewUrl": "http://higlass.io/api/v1/viewconfs/",
  "zoomLocks": {
    "locksByViewUid": {},
    "locksDict": {}
  },
  "trackSourceServers": [
    "http://higlass.io/api/v1"
  ],
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
