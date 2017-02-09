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
        "w": 3,
        "h": 12,
        "x": 0,
        "y": 0,
        "i": "aa",
        "moved": false,
        "static": false
      },
      "uid": "aa",
      "initialYDomain": [
        31860141.134457074,
        48692513.298671976
      ],
      "autocompleteSource": "http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "initialXDomain": [
        22200702.33065603,
        54045730.749440975
      ],
      "tracks": {
        "bottom": [],
        "top": [
            {'type': 'top-axis'},
          {
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "b6qFe7fOSnaX-YkP2kzN1w",
            "type": "horizontal-line",
            "options": {
              "axisPositionHorizontal": "left",
              "name": "wgEncodeSydhTfbsGm12878Ctcfsc15914c20StdSig.hitile"
            },
            "height": 20,
            "position": "top",
            "uid": "Bcy2QmIMTTuDdCQ2fk6QUQ",
            "name": "wgEncodeSydhTfbsGm12878Ctcfsc15914c20StdSig.hitile",
            "maxWidth": 4294967296,
            "maxZoom": 22
          }
        ],
        "right": [],
        "center": [
          {
            "uid": "c1",
            "height": 200,
            "position": "center",
            "type": "combined",
            "options": {},
            "contents": [
              {
                "uid": "eyeWh7MrSNCoSEI9b_7XXQ",
                "maxWidth": 4194304000,
                "tilesetUid": "CQMd6V_cRw6iCI_-Unl3PQ",
                "binsPerDimension": 256,
                "server": "http://higlass.io/api/v1",
                "maxZoom": 14,
                "position": "center",
                "type": "heatmap",
                "options": {
                  "maxZoom": null,
                  "labelPosition": "bottomRight",
                  "colorRange": [
                    "#FFFFFF",
                    "#F8E71C",
                    "#F5A623",
                    "#D0021B"
                  ],
                  "name": "Rao et al. (2014) GM12878 MboI (allreps) 1kb"
                },
                "name": "Rao et al. (2014) GM12878 MboI (allreps) 1kb"
              }
            ]
          }
        ],
        "left": [
            {'type': 'left-axis', 'width': 100},
          {
            "uuid": "fhng_PTMRNekrUXp738MMQ",
            "filetype": "hitile",
            "datatype": "vector",
            "private": false,
            "name": "wgEncodeSydhTfbsGm12878Pol2s2IggmusSig.hitile",
            "coordSystem": "hg19",
            "coordSystem2": "",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "fhng_PTMRNekrUXp738MMQ",
            "serverUidKey": "http://higlass.io/api/v1/fhng_PTMRNekrUXp738MMQ",
            "uid": "VvfVw1zWSsKwBfnhmt4bHQ",
            "type": "vertical-line",
            "options": {
              "name": "wgEncodeSydhTfbsGm12878Pol2s2IggmusSig.hitile",
              "axisPositionVertical": "top"
            },
            "width": 20,
            "height": 20,
            "maxWidth": 4294967296,
            "maxZoom": 22,
            "position": "left"
          },
          {
            "uid": "IYBlYL3sSeue_6x5ioPp9A",
            "width": 30,
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "position": "left",
            "type": "vertical-chromosome-labels",
            "options": {},
            "name": "Chromosome Labels (hg19)"
          }
        ]
      },
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "genomePositionSearchBoxVisible": true
    },
    {
      "layout": {
        "w": 3,
        "h": 12,
        "x": 3,
        "y": 0,
        "i": "YrCE0SDAQfC4qehWjEQIhQ",
        "moved": false,
        "static": false
      },
      "uid": "YrCE0SDAQfC4qehWjEQIhQ",
      "initialYDomain": [
          100000000,300000000
      ],
      "autocompleteSource": "http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "initialXDomain": [
        167696214.19671458,
        307851973.6973484
      ],
      "tracks": {
        "bottom": [],
        "top": [
            {'type': 'top-axis'},
          {
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "b6qFe7fOSnaX-YkP2kzN1w",
            "type": "horizontal-line",
            "options": {
              "axisPositionHorizontal": "left",
              "name": "wgEncodeSydhTfbsGm12878Ctcfsc15914c20StdSig.hitile"
            },
            "height": 20,
            "position": "top",
            "uid": "Bcy2QmIMTTuDdCQ2fk6QUQ",
            "name": "wgEncodeSydhTfbsGm12878Ctcfsc15914c20StdSig.hitile",
            "maxWidth": 4294967296,
            "maxZoom": 22
          }
        ],
        "right": [],
        "center": [
          {
            "uid": "c1",
            "height": 200,
            "position": "center",
            "type": "combined",
            "options": {},
            "contents": [
              {
                "uid": "eyeWh7MrSNCoSEI9b_7XXQ",
                "maxWidth": 4194304000,
                "tilesetUid": "CQMd6V_cRw6iCI_-Unl3PQ",
                "binsPerDimension": 256,
                "server": "http://higlass.io/api/v1",
                "maxZoom": 14,
                "position": "center",
                "type": "heatmap",
                "options": {
                  "maxZoom": null,
                  "labelPosition": "bottomRight",
                  "colorRange": [
                    "#FFFFFF",
                    "#F8E71C",
                    "#F5A623",
                    "#D0021B"
                  ],
                  "name": "Rao et al. (2014) GM12878 MboI (allreps) 1kb"
                },
                "name": "Rao et al. (2014) GM12878 MboI (allreps) 1kb"
              }
            ]
          }
        ],
        "left": [
            {'type': 'left-axis', 'width': 100},
          {
            "uuid": "fhng_PTMRNekrUXp738MMQ",
            "filetype": "hitile",
            "datatype": "vector",
            "private": false,
            "name": "wgEncodeSydhTfbsGm12878Pol2s2IggmusSig.hitile",
            "coordSystem": "hg19",
            "coordSystem2": "",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "fhng_PTMRNekrUXp738MMQ",
            "serverUidKey": "http://higlass.io/api/v1/fhng_PTMRNekrUXp738MMQ",
            "uid": "VvfVw1zWSsKwBfnhmt4bHQ",
            "type": "vertical-line",
            "options": {
              "name": "wgEncodeSydhTfbsGm12878Pol2s2IggmusSig.hitile",
              "axisPositionVertical": "top"
            },
            "width": 20,
            "height": 20,
            "maxWidth": 4294967296,
            "maxZoom": 22,
            "position": "left"
          },
          {
            "uid": "IYBlYL3sSeue_6x5ioPp9A",
            "width": 30,
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "position": "left",
            "type": "vertical-chromosome-labels",
            "options": {},
            "name": "Chromosome Labels (hg19)"
          }
        ]
      },
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "genomePositionSearchBoxVisible": true
    }
  ],
  "editable": true,
  "exportViewUrl": "http://higlass.io/api/v1/viewconfs/",
  "zoomLocks": {
    "locksByViewUid": {},
    "zoomLocksDict": {}
  },
  "trackSourceServers": [
    "http://higlass.io/api/v1"
  ]
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
