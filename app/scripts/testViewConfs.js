export const chromInfoTrack = 
          {
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "type": "horizontal-chromosome-labels",
            "position": "top",
            "name": "Chromosome Labels (hg19)",
            "height": 30,
            "uid": "I1QUF22JQJuJ38j9PS4iqw",
            "options": {}
          };


export const heatmapTrack = {
                "filetype": "cooler",
                "name": "Dixon et al. (2015) H1_TB HindIII (allreps) 1kb",
                "server": "http://higlass.io/api/v1",
                "tilesetUid": "B2LevKBtRNiCMX372rRPLQ",
                "uid": "heatmap3",
                "type": "heatmap",
                "options": {
                  "labelPosition": "bottomRight",
                  "colorRange": [
                    "white",
                    "rgba(245,166,35,1.0)",
                    "rgba(208,2,27,1.0)",
                    "black"
                  ],
                  "maxZoom": null,
                  "colorbarLabelsPosition": "outside",
                  "colorbarPosition": "topLeft",
                  "name": "New tileset"
                },
                "width": 20,
                "height": 20,
                "maxWidth": 4194304000,
                "binsPerDimension": 256,
                "position": "center"
              };

export const twoViewConfig = 
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
        1796142508.3343146,
        1802874737.269993
      ],
      "initialYDomain": [
        1795888772.6557815,
        1806579890.9341388
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
              "labelPosition": "hidden",
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
        "left": [],
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
                    "white",
                    "rgba(245,166,35,1.0)",
                    "rgba(208,2,27,1.0)",
                    "black"
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
        "right": [],
        "bottom": []
      },
      "layout": {
        "w": 5,
        "h": 12,
        "x": 0,
        "y": 0,
        "i": "aa",
        "moved": false,
        "static": false
      }
    },
    {
      "uid": "view2",
      "initialXDomain": [
        1796142508.3343008,
        1802874737.270007
      ],
      "initialYDomain": [
        1795888772.6557593,
        1806579890.9341605
      ],
      "autocompleteSource": "http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "genomePositionSearchBoxVisible": true,
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "tracks": {
        "top": [
          {
            "filetype": "hitile",
            "name": "wgEncodeSydhTfbsGm12878Ctcfsc15914c20StdSig.hitile",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "b6qFe7fOSnaX-YkP2kzN1w",
            "uid": "line2",
            "type": "horizontal-line",
            "options": {
              "labelColor": "black",
              "labelPosition": "topLeft",
              "axisPositionHorizontal": "left",
              "lineStrokeColor": "blue",
              "valueScaling": "linear",
              "name": "wgEncodeSydhTfbsGm12878Ctcfsc15914c20StdSig.hitile"
            },
            "width": 20,
            "height": 20,
            "maxWidth": 4294967296,
            "position": "top"
          }
        ],
        "left": [],
        "center": [
          {
            "uid": "c2",
            "type": "combined",
            "contents": [
              {
                "filetype": "cooler",
                "name": "Dixon et al. (2015) H1_TB HindIII (allreps) 1kb",
                "server": "http://higlass.io/api/v1",
                "tilesetUid": "clU7yGb-S7eY4yNbdDlj9w",
                "uid": "heatmap2",
                "type": "heatmap",
                "options": {
                  "labelPosition": "bottomRight",
                  "colorRange": [
                    "white",
                    "rgba(245,166,35,1.0)",
                    "rgba(208,2,27,1.0)",
                    "black"
                  ],
                  "maxZoom": null,
                  "colorbarLabelsPosition": "outside",
                  "colorbarPosition": "topLeft",
                  "name": "Dixon et al. (2015) H1_TB HindIII (allreps) 1kb"
                },
                "width": 20,
                "height": 20,
                "maxWidth": 4194304000,
                "binsPerDimension": 256,
                "position": "center"
              }
            ],
            "position": "center",
            "options": {}
          }
        ],
        "right": [],
        "bottom": []
      },
      "layout": {
        "w": 6,
        "h": 12,
        "x": 6,
        "y": 0,
        "i": "view2",
        "moved": false,
        "static": false
      }
    }
  ],
  "zoomLocks": {
    "locksByViewUid": {
      "view2": "JAFSZPdmSWe72WgTnVDtbA",
      "aa": "JAFSZPdmSWe72WgTnVDtbA"
    },
    "locksDict": {
      "JAFSZPdmSWe72WgTnVDtbA": {
        "view2": [
          1812727561.5083356,
          1873757116.378131,
          475954.14177536964
        ],
        "aa": [
          1812727561.5083356,
          1873757116.378131,
          475954.14177536964
        ]
      }
    }
  },
  "locationLocks": {
    "locksByViewUid": {
      "view2": "fRq4SRH8TSyVveKqebWsxw",
      "aa": "fRq4SRH8TSyVveKqebWsxw"
    },
    "locksDict": {
      "fRq4SRH8TSyVveKqebWsxw": {
        "view2": [
          1812727561.5083356,
          1873757116.378131,
          475954.14177536964
        ],
        "aa": [
          1812727561.5083356,
          1873757116.378131,
          475954.14177536964
        ]
      }
    }
  }
}
export const valueIntervalTrackViewConf = 
{
  "editable": true,
  "zoomFixed": false,
  "trackSourceServers": [
    "http://higlass.io/api/v1",
    "http://127.0.0.1:8989/api/v1"
  ],
  "exportViewUrl": "http://higlass.io/api/v1/viewconfs/",
  "views": [
    {
      "uid": "view2",
      "initialXDomain": [
        -1521535012.049488,
        4253785557.7320385
      ],
      "initialYDomain": [
        -1074275219.9894483,
        5601783420.308463
      ],
      "autocompleteSource": "http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "genomePositionSearchBoxVisible": false,
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "tracks": {
        "top": [
          {
            "filetype": "beddb",
            "name": "9ae0744a-9bc1-4cd7-b7cf-c6569ed9e4aa.consensus.20170119.somatic.cna.annotated.txt.multires",
            "server": "http://127.0.0.1:8989/api/v1",
            "tilesetUid": "WRfF4fKBR1S8gS5RSd-7YQ",
            "uid": "Pq_LNH6SRISVqrUl4n53Dg",
            "type": "1d-value-interval",
            "options": {
              "name": "9ae0744a-9bc1-4cd7-b7cf-c6569ed9e4aa.consensus.20170119.somatic.cna.annotated.txt.multires"
            },
            "width": 902,
            "height": 36,
            "maxWidth": 4294967296,
            "position": "top"
          },
          {
            "filetype": "beddb",
            "name": "Gene Annotations (hg19)",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "OHJakQICQD6gTD7skx4EWA",
            "uid": "ElEL52SpQiWEtxaa5X4NhA",
            "type": "horizontal-gene-annotations",
            "options": {
              "labelColor": "black",
              "labelPosition": "hidden",
              "plusStrandColor": "blue",
              "minusStrandColor": "red",
              "name": "Gene Annotations (hg19)"
            },
            "width": 20,
            "height": 60,
            "maxWidth": 4294967296,
            "position": "top"
          },
          {
            "type": "horizontal-chromosome-labels",
            "local": true,
            "orientation": "1d-horizontal",
            "minHeight": 30,
            "name": "Chromosome Axis (mm9)",
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "thumbnail": null,
            "server": "",
            "tilesetUid": "bdM4fbUGQVuAv09iWcOefQ",
            "uid": "K8ctyFcBQGCXnHBSeCQpaQ",
            "options": {},
            "width": 20,
            "height": 30,
            "position": "top"
          }
        ],
        "left": [
          {
            "filetype": "beddb",
            "name": "Gene Annotations (hg19)",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "OHJakQICQD6gTD7skx4EWA",
            "uid": "L5FM6--PTeaof462uQB0ww",
            "type": "vertical-gene-annotations",
            "options": {
              "labelColor": "black",
              "labelPosition": "hidden",
              "plusStrandColor": "blue",
              "minusStrandColor": "red",
              "name": "Gene Annotations (hg19)"
            },
            "width": 60,
            "height": 20,
            "maxWidth": 4294967296,
            "position": "left"
          },
          {
            "type": "vertical-chromosome-labels",
            "local": true,
            "orientation": "1d-vertical",
            "minWidth": 30,
            "minHeight": 30,
            "name": "Chromosome Axis (hg19)",
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "thumbnail": null,
            "server": "",
            "tilesetUid": "HZ8jVQNAQFCd4DCcWPrR8A",
            "uid": "Boe4m22pQwS2D7QqVpaV6w",
            "options": {},
            "width": 30,
            "height": 30,
            "position": "left"
          }
        ],
        "center": [
          {
            "uid": "ZDQ72_nqQiqaC3ZR2pcB4Q",
            "type": "combined",
            "contents": [
              {
                "filetype": "bed2ddb",
                "name": "9ae0744a-9bc1-4cd7-b7cf-c6569ed9e4aa.pcawg_consensus_1.6.161022.somatic.sv.bedpe.multires.db",
                "server": "http://127.0.0.1:8989/api/v1",
                "tilesetUid": "Vohl6uJnRfCjKrMh7HCoUA",
                "uid": "JYciTCMsSPyHZ87vveCuIQ",
                "type": "square-markers",
                "options": {
                  "labelColor": "black",
                  "labelPosition": "hidden",
                  "name": "9ae0744a-9bc1-4cd7-b7cf-c6569ed9e4aa.pcawg_consensus_1.6.161022.somatic.sv.bedpe.multires.db"
                },
                "width": 20,
                "height": 20,
                "maxWidth": 4294967296,
                "position": "center"
              }
            ],
            "position": "center",
            "options": {}
          }
        ],
        "right": [],
        "bottom": []
      },
      "layout": {
        "w": 8,
        "h": 12,
        "x": 0,
        "y": 0,
        "i": "view2",
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
    "locksByViewUid": {
      "view2": "TjZWrnsgR3eg5v_iFXC1vQ",
      "aa": "TjZWrnsgR3eg5v_iFXC1vQ"
    },
    "locksDict": {
      "TjZWrnsgR3eg5v_iFXC1vQ": {
        "view2": [
          1812727561.5083356,
          1873757116.378131,
          475954.14177536964
        ],
        "aa": [
          1812727561.5083356,
          1873757116.378131,
          475954.14177536964
        ]
      }
    }
  }
}
