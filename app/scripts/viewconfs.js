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
        "i": "YrCE0SDAQfC4qehWjEQIhQ",
        "moved": false,
        "static": false
      },
      "uid": "YrCE0SDAQfC4qehWjEQIhQ",
      "initialYDomain": [
        1420699891.9190712,
        1559741702.7432761
      ],
      "autocompleteSource": "http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "initialXDomain": [
        1358947274.6036685,
        1665471266.6479378
      ],
      "tracks": {
        "bottom": [],
        "top": [],
        "right": [],
        "center": [
          {
            "tilesetUid": "CQMd6V_cRw6iCI_-Unl3PQ",
            "server": "http://higlass.io/api/v1",
            "position": "center",
            "type": "heatmap",
            "height": 300,
            "options": {
              "flipped": true,
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
            "uid": "chowqH5RR7iRTBK-F0S81A",
            "name": "Rao et al. (2014) GM12878 MboI (allreps) 1kb",
            "maxWidth": 4194304000,
            "binsPerDimension": 256,
            "maxZoom": 14
          }
        ],
        "left": []
      },
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "genomePositionSearchBoxVisible": true
    },
    {
      "layout": {
        "w": 6,
        "h": 12,
        "x": 0,
        "y": 12,
        "i": "bcTs4G36QWqM3KwuBuoW4g",
        "moved": false,
        "static": false
      },
      "uid": "bcTs4G36QWqM3KwuBuoW4g",
      "initialYDomain": [
        1339285544.933454,
        1911088777.7000628
      ],
      "autocompleteSource": "http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "initialXDomain": [
        913783135.0021869,
        2174349352.6922097
      ],
      "tracks": {
        "bottom": [],
        "top": [],
        "right": [],
        "center": [
          {
            "type": "combined",
            "uid": "QOaVD-I7TAajQVN8_-otZA",
            "height": 300,
            "contents": [
              {
                "tilesetUid": "CQMd6V_cRw6iCI_-Unl3PQ",
                "server": "http://higlass.io/api/v1",
                "position": "center",
                "type": "heatmap",
                "height": 300,
                "options": {
                  "flipped": true,
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
                "uid": "chowqH5RR7iRTBK-F0S81A",
                "name": "Rao et al. (2014) GM12878 MboI (allreps) 1kb",
                "maxWidth": 4194304000,
                "binsPerDimension": 256,
                "maxZoom": 14
              },
              {
                "uid": "e8HHoHzBRbSmpilULc47ZQ",
                "type": "viewport-projection-center",
                "fromViewUid": "YrCE0SDAQfC4qehWjEQIhQ",
                "options": {},
                "name": "Viewport Projection",
                "position": "center"
              }
            ],
            "position": "center"
          }
        ],
        "left": []
      },
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "genomePositionSearchBoxVisible": true
    }
  ],
  "editable": true,
  "exportViewUrl": "http://higlass.io/api/v1/viewconfs/",
  "zoomLocks": {
    "locksByViewUid": {
      "bcTs4G36QWqM3KwuBuoW4g": "K8vG3KWqSXCsJ32f1wqNwQ",
      "YrCE0SDAQfC4qehWjEQIhQ": "K8vG3KWqSXCsJ32f1wqNwQ"
    },
    "locksDict": {
      "K8vG3KWqSXCsJ32f1wqNwQ": {
        "bcTs4G36QWqM3KwuBuoW4g": [
          902692953.5592829,
          1029120537.3913019,
          1856504.0024889708
        ],
        "YrCE0SDAQfC4qehWjEQIhQ": [
          870835980.3378874,
          894154173.4057167,
          451434.4507279396
        ]
      }
    }
  },
  "trackSourceServers": [
    "http://higlass.io/api/v1"
  ],
  "locationLocks": {
    "locksByViewUid": {
      "bcTs4G36QWqM3KwuBuoW4g": "VqmHqXwPRC6_zfd-DosUMw",
      "YrCE0SDAQfC4qehWjEQIhQ": "VqmHqXwPRC6_zfd-DosUMw"
    },
    "locksDict": {
      "VqmHqXwPRC6_zfd-DosUMw": {
        "bcTs4G36QWqM3KwuBuoW4g": [
          650208409.2798027,
          811909569.3483436,
          1856504.0024785213
        ],
        "YrCE0SDAQfC4qehWjEQIhQ": [
          618351436.0584072,
          676943205.3627586,
          451434.4507253766
        ]
      }
    }
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
