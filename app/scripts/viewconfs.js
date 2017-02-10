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
        "h": 3,
        "x": 0,
        "y": 0,
        "i": "aa",
        "moved": false,
        "static": false
      },
      "uid": "aa",
      "initialYDomain": [
        0, 100000000
      ],
      "autocompleteSource": "http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "initialXDomain": [
        0, 100000000
      ],
      "tracks": {
        "bottom": [],
        "top": [
          {
            "uuid": "Hyc3TZevQVm3FcTAZShLQg",
            "maxWidth": 4194304000,
            "width": 1216,
            "datatype": "matrix",
            "binsPerDimension": 256,
            "filetype": "cooler",
            "coordSystem": "hg19",
            "private": false,
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "Hyc3TZevQVm3FcTAZShLQg",
            "maxZoom": 14,
            "serverUidKey": "http://higlass.io/api/v1/Hyc3TZevQVm3FcTAZShLQg",
            "uid": "YbUe-NGzSUi83tEMHCW3bA",
            "height": 57,
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
              "name": "Aiden et al. (2009) GM06900 HINDIII 1kb"
            },
            "coordSystem2": "",
            "name": "Aiden et al. (2009) GM06900 HINDIII 1kb",
            "position": "top"
          },
          {
            "uid": "M4xM1WSwTrOeOhgh-9iIQw",
            "height": 44,
            "width": 1216,
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "position": "top",
            "type": "horizontal-chromosome-labels",
            "options": {},
            "name": "Chromosome Labels (hg19)"
          },
          {
            "uid": "OHJakQICQD6gTD7skx4EWA",
            "maxWidth": 4294967296,
            "tilesetUid": "OHJakQICQD6gTD7skx4EWA",
            "server": "http://higlass.io/api/v1",
            "width": 1216,
            "maxZoom": 22,
            "position": "top",
            "height": 89,
            "type": "horizontal-gene-annotations",
            "options": {
              "name": "Gene Annotations (hg19)"
            },
            "name": "Gene Annotations (hg19)"
          }
        ],
        "right": [],
        "center": [
            {
                "uuid": "GGKJ59R-RsKtwgIgFohOhA",
                "filetype": "cooler",
                "datatype": "matrix",
                "private": false,
                "name": "Dixon et al. (2015) H1_MS HindIII (allreps) 1kb",
                "coordSystem": "hg19",
                "coordSystem2": "",
                "server": "http://higlass.io/api/v1",
                "tilesetUid": "GGKJ59R-RsKtwgIgFohOhA",
                "serverUidKey": "http://higlass.io/api/v1/GGKJ59R-RsKtwgIgFohOhA",
                "uid": "Hqt7lBgGSIqN_b6T_HbEdw",
                "type": "heatmap",
                "options": {
                  "labelPosition": "bottomRight",
                  "colorRange": [
                    "#FFFFFF",
                    "#F8E71C",
                    "rgba(245,166,35,1)",
                    "rgba(0,0,0,1)"
                  ],
                  "maxZoom": null,
                  "name": "Dixon et al. (2015) H1_MS HindIII (allreps) 1kb"
                },
                "width": 20,
                "height": 20,
                "maxWidth": 4194304000,
                "binsPerDimension": 256,
                "maxZoom": 14
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
