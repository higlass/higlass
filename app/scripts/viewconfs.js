var remoteServer = "//higlass.io/api/v1";
var localServer = "/api/v1";
//var usedServer = localServer;
var usedServer = remoteServer;

export const testViewConfig = 
{
   "zoomFixed":false,
   "views":[
      {
         "layout":{
            "i":"aa",
            "h":21,
            "moved":false,
            "static":false,
            "w":2,
            "y":0,
            "x":0
         },
         "uid":"aa",
         "initialYDomain":[
            1526935567.4106581,
            1527083845.4925566
         ],
         "autocompleteSource":"http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
         "initialXDomain":[
            1526970468.1522324,
            1527055938.4876497
         ],
         "tracks":{
            "left":[
               {
                  "name":"Gene Annotations",
                  "tilesetUid":"OHJakQICQD6gTD7skx4EWA",
                  "server":"http://higlass.io/api/v1",
                  "width":60,
                  "position":"left",
                  "type":"vertical-gene-annotations",
                  "options":{
                     "name":"Gene Annotations (hg19)",
                     "labelPosition":"bottomRight"
                  },
                  "uid":"Ctce6eWRThOnaCKZPPr_gg"
               },
               {
                  "uid":"TtMQCco7R3mqcXkg82iGjA",
                  "width":40,
                  "chromInfoPath":"//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
                  "position":"left",
                  "type":"vertical-chromosome-labels",
                  "name":"Chromosome Labels (hg19)"
               }
            ],
            "top":[
               {
                  "uid":"OHJakQICQD6gTD7skx4EWA",
                  "tilesetUid":"OHJakQICQD6gTD7skx4EWA",
                  "height":60,
                  "position":"top",
                  "server":"http://higlass.io/api/v1",
                  "type":"horizontal-gene-annotations",
                  "options":{
                     "name":"Gene Annotations (hg19)"
                  },
                  "name":"Gene Annotations"
               },
               {
                  "uid":"SSA9vSmxQWG1xJK2aDJqzg",
                  "height":40,
                  "chromInfoPath":"//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
                  "position":"top",
                  "type":"horizontal-chromosome-labels",
                  "name":"Chromosome Labels (hg19)"
               }
            ],
            "right":[

            ],
            "center":[
               {
                  "position":"center",
                  "type":"combined",
                  "uid":"c1",
                  "contents":[
                     {
                        "uid":"LDceFInbSHa5TMxR6DAtBg",
                        "tilesetUid":"CQMd6V_cRw6iCI_-Unl3PQ",
                        "server":"http://higlass.io/api/v1",
                        "position":"center",
                        "type":"heatmap",
                        "options":{
                           "maxZoom":null,
                           "name":"Rao et al. (2014) GM12878 MboI (allreps) 1kb",
                           "colorRange":[
                              "#FFFFFF",
                              "#F8E71C",
                              "#F5A623",
                              "#D0021B"
                           ],
                           "labelPosition":"topLeft"
                        }
                     }
                  ],
                  "height":200
               }
            ],
            "bottom":[

            ]
         },
         "chromInfoPath":"//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
         "genomePositionSearchBoxVisible":true
      },
      {
         "layout":{
            "i":"PrK3pcx0RKKgZBZ3RD03sA",
            "h":21,
            "moved":false,
            "static":false,
            "w":2,
            "y":0,
            "x":2
         },
         "uid":"PrK3pcx0RKKgZBZ3RD03sA",
         "initialYDomain":[
            1526241698.1780841,
            1527641126.293526
         ],
         "autocompleteSource":"http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
         "initialXDomain":[
            1526625354.7150316,
            1527432011.9693475
         ],
         "tracks":{
            "left":[
               {
                  "name":"Gene Annotations",
                  "tilesetUid":"OHJakQICQD6gTD7skx4EWA",
                  "server":"http://higlass.io/api/v1",
                  "width":60,
                  "position":"left",
                  "type":"vertical-gene-annotations",
                  "options":{
                     "name":"Gene Annotations (hg19)",
                     "labelPosition":"bottomRight"
                  },
                  "uid":"Ctce6eWRThOnaCKZPPr_gg"
               },
               {
                  "uid":"TtMQCco7R3mqcXkg82iGjA",
                  "width":40,
                  "chromInfoPath":"//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
                  "position":"left",
                  "type":"vertical-chromosome-labels",
                  "name":"Chromosome Labels (hg19)"
               }
            ],
            "top":[
               {
                  "uid":"OHJakQICQD6gTD7skx4EWA",
                  "tilesetUid":"OHJakQICQD6gTD7skx4EWA",
                  "height":60,
                  "position":"top",
                  "server":"http://higlass.io/api/v1",
                  "type":"horizontal-gene-annotations",
                  "options":{
                     "name":"Gene Annotations (hg19)"
                  },
                  "name":"Gene Annotations"
               },
               {
                  "uid":"SSA9vSmxQWG1xJK2aDJqzg",
                  "height":40,
                  "chromInfoPath":"//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
                  "position":"top",
                  "type":"horizontal-chromosome-labels",
                  "name":"Chromosome Labels (hg19)"
               }
            ],
            "right":[

            ],
            "center":[
               {
                  "position":"center",
                  "type":"combined",
                  "uid":"c1",
                  "contents":[
                     {
                        "uid":"LDceFInbSHa5TMxR6DAtBg",
                        "tilesetUid":"CQMd6V_cRw6iCI_-Unl3PQ",
                        "server":"http://higlass.io/api/v1",
                        "position":"center",
                        "type":"heatmap",
                        "options":{
                           "maxZoom":null,
                           "name":"Rao et al. (2014) GM12878 MboI (allreps) 1kb",
                           "colorRange":[
                              "#FFFFFF",
                              "#F8E71C",
                              "#F5A623",
                              "#D0021B"
                           ],
                           "labelPosition":"topLeft"
                        }
                     },
                     {
                        "fromViewUid":"aa",
                        "position":"center",
                        "type":"viewport-projection-center",
                        "uid":"PKNXs8hZQgG3PVBzPF4JWQ",
                        "name":"Viewport Projection"
                     },
                     {
                        "fromViewUid":"Qv9Vw5uKREWUUliGqc0O9Q",
                        "type":"viewport-projection-center",
                        "uid":"DiPCW5J5STi_0KyMIy5fCQ",
                        "name":"Viewport Projection"
                     }
                  ],
                  "height":200
               }
            ],
            "bottom":[

            ]
         },
         "chromInfoPath":"//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
         "genomePositionSearchBoxVisible":true
      },
      {
         "layout":{
            "i":"Qv9Vw5uKREWUUliGqc0O9Q",
            "h":21,
            "moved":false,
            "static":false,
            "w":2,
            "y":0,
            "x":4
         },
         "uid":"Qv9Vw5uKREWUUliGqc0O9Q",
         "initialYDomain":[
            1526934463.1400635,
            1527099993.9109073
         ],
         "autocompleteSource":"http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
         "initialXDomain":[
            1527212187.9640086,
            1527307603.080827
         ],
         "tracks":{
            "left":[
               {
                  "name":"Gene Annotations",
                  "tilesetUid":"OHJakQICQD6gTD7skx4EWA",
                  "server":"http://higlass.io/api/v1",
                  "width":60,
                  "position":"left",
                  "type":"vertical-gene-annotations",
                  "options":{
                     "name":"Gene Annotations (hg19)",
                     "labelPosition":"bottomRight"
                  },
                  "uid":"Ctce6eWRThOnaCKZPPr_gg"
               },
               {
                  "uid":"TtMQCco7R3mqcXkg82iGjA",
                  "width":40,
                  "chromInfoPath":"//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
                  "position":"left",
                  "type":"vertical-chromosome-labels",
                  "name":"Chromosome Labels (hg19)"
               }
            ],
            "top":[
               {
                  "uid":"OHJakQICQD6gTD7skx4EWA",
                  "tilesetUid":"OHJakQICQD6gTD7skx4EWA",
                  "height":60,
                  "position":"top",
                  "server":"http://higlass.io/api/v1",
                  "type":"horizontal-gene-annotations",
                  "options":{
                     "name":"Gene Annotations (hg19)"
                  },
                  "name":"Gene Annotations"
               },
               {
                  "uid":"SSA9vSmxQWG1xJK2aDJqzg",
                  "height":40,
                  "chromInfoPath":"//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
                  "position":"top",
                  "type":"horizontal-chromosome-labels",
                  "name":"Chromosome Labels (hg19)"
               }
            ],
            "right":[

            ],
            "center":[
               {
                  "position":"center",
                  "type":"combined",
                  "uid":"c1",
                  "contents":[
                     {
                        "uid":"LDceFInbSHa5TMxR6DAtBg",
                        "tilesetUid":"CQMd6V_cRw6iCI_-Unl3PQ",
                        "server":"http://higlass.io/api/v1",
                        "position":"center",
                        "type":"heatmap",
                        "options":{
                           "maxZoom":null,
                           "name":"Rao et al. (2014) GM12878 MboI (allreps) 1kb",
                           "colorRange":[
                              "#FFFFFF",
                              "#F8E71C",
                              "#F5A623",
                              "#D0021B"
                           ],
                           "labelPosition":"topLeft"
                        }
                     },
                     {
                        "fromViewUid":"aa",
                        "position":"center",
                        "type":"viewport-projection-center",
                        "uid":"PKNXs8hZQgG3PVBzPF4JWQ",
                        "name":"Viewport Projection"
                     }
                  ],
                  "height":200
               }
            ],
            "bottom":[

            ]
         },
         "chromInfoPath":"//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
         "genomePositionSearchBoxVisible":true
      }
   ],
   "editable":true,
   "exportViewUrl":"http://higlass.io/api/v1/viewconfs/",
   "zoomLocks":{
      "locksByViewUid":{
         "aa":"Tocp3setTEq6AJrh7vnmJQ",
         "PrK3pcx0RKKgZBZ3RD03sA":"Tocp3setTEq6AJrh7vnmJQ"
      },
      "zoomLocksDict":{
         "Tocp3setTEq6AJrh7vnmJQ":{
            "aa":[
               1527019296.5,
               1527019296.5,
               93.09160304069519
            ],
            "PrK3pcx0RKKgZBZ3RD03sA":[
               1527034776.5222485,
               1526951002.2841978,
               1914.2706911563873
            ]
         }
      }
   },
   "trackSourceServers":[
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
      "layout": {"x": 0, "y": 0, "w": 3, "h": 8},
      "initialXDomain": [
            0,
            3000000000
      ],
      "autocompleteSource": remoteServer + "/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "genomePositionSearchBoxVisible": true,
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "tracks": {
        "top": [
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
            "server": remoteServer,
            "position": "left",
            "name": "Gene Annotations"
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
