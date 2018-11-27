function makeViewConf(regions1d, regions2d) {
  return {
    editable: true,
    zoomFixed: false,
    views: [
      {
        uid: 'aa',
        initialXDomain: [0, 3500000000],
        initialYDomain: [0, 3500000000],
        chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
        tracks: {
          top: [
            {
              chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
              type: 'horizontal-chromosome-labels',
              name: 'Chromosome Labels (hg19)',
              height: 30
            },
            {
              type: 'horizontal-1d-annotations',
              options: {
                regions: regions1d,
                minRectWidth: 3,
                fillOpacity: 0.1,
                stroke: 'blue',
                strokePos: ['left', 'right'],
                strokeWidth: 2,
                strokeOpacity: 0.6,
              }
            }
          ],
          left: [
            {
              chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
              type: 'vertical-chromosome-labels',
              name: 'Chromosome Labels (hg19)',
              width: 30
            }
          ],
          center: [
            {
              type: 'combined',
              height: 200,
              contents: [
                {
                  server: 'http://higlass.io/api/v1',
                  tilesetUid: 'CQMd6V_cRw6iCI_-Unl3PQ',
                  type: 'heatmap',
                  position: 'center',
                  options: {
                    colorRange: [
                      '#FFFFFF',
                      '#F8E71C',
                      '#F5A623',
                      '#D0021B'
                    ],
                    colorbarPosition: 'topRight',
                    colorbarLabelsPosition: 'outside',
                    maxZoom: null,
                    labelPosition: 'bottomLeft',
                    name: 'Rao et al. (2014) GM12878 MboI (allreps) 1kb'
                  },
                  uid: 'heatmap1',
                  name: 'Rao et al. (2014) GM12878 MboI (allreps) 1kb',
                  maxWidth: 4194304000,
                  binsPerDimension: 256,
                  maxZoom: 14
                },
                {
                  type: '2d-chromosome-annotations', // or 2d-annotations?
                  chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
                  options: {
                    minRectWidth: 6,
                    minRectHeight: 6,
                    regions: regions2d
                  }
                },
                {
                  type: '2d-chromosome-grid',
                  datatype: [
                    'chromosome-2d-grid'
                  ],
                  local: true,
                  orientation: '2d',
                  name: 'Chromosome Grid (hg19)',
                  chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
                  thumbnail: null,
                  uuid: 'TIlwFtqxTX-ndtM7Y9k1bw',
                  server: '',
                  tilesetUid: 'TIlwFtqxTX-ndtM7Y9k1bw',
                  serverUidKey: '/TIlwFtqxTX-ndtM7Y9k1bw',
                  uid: 'LUVqXXu2QYiO8XURIwyUyA',
                }

              ]
            }
          ],
        },
        layout: {
          w: 12,
          h: 12,
          x: 0,
          y: 0,
          i: 'aa',
          moved: false,
          static: false
        }
      }
    ],
    zoomLocks: {
      locksByViewUid: {},
      locksDict: {}
    },
    locationLocks: {
      locksByViewUid: {},
      locksDict: {}
    }
  };
}
