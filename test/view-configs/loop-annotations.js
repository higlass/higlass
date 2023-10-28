// @ts-nocheck
const viewconf = {
  editable: true,
  zoomFixed: false,
  trackSourceServers: ['//higlass.io/api/v1'],
  exportViewUrl: '/api/v1/viewconfs',
  views: [
    {
      uid: 'aa',
      initialXDomain: [1331614027.3846939, 1332167296.1945133],
      autocompleteSource: '/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&',
      genomePositionSearchBox: {
        autocompleteServer: '//higlass.io/api/v1',
        autocompleteId: 'OHJakQICQD6gTD7skx4EWA',
        chromInfoServer: '//higlass.io/api/v1',
        chromInfoId: 'hg19',
        visible: true,
      },
      chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
      tracks: {
        top: [],
        left: [],
        center: [
          {
            uid: 'c1',
            type: 'combined',
            height: 608,
            contents: [
              {
                name: 'HiCCUPS Loops',
                server: '//higlass.io/api/v1',
                tilesetUid: 'HunfK2D3R9iBdIq-YNYjiw',
                uid: 't1',
                type: '2d-rectangle-domains',
                options: {
                  labelColor: 'black',
                  labelPosition: 'hidden',
                  labelLeftMargin: 0,
                  labelRightMargin: 0,
                  labelTopMargin: 0,
                  labelBottomMargin: 0,
                  trackBorderWidth: 0,
                  trackBorderColor: 'black',
                  rectangleDomainFillColor: 'cyan',
                  rectangleDomainStrokeColor: 'black',
                  rectangleDomainOpacity: 1,
                  minSquareSize: 'none',
                  name: 'HiCCUPS Loops',
                },
                position: 'center',
                width: 857,
                height: 608,
              },
            ],
            position: 'center',
            options: {},
            width: 857,
          },
        ],
        right: [],
        bottom: [],
        whole: [],
        gallery: [],
      },
      layout: {
        w: 12,
        h: 12,
        x: 0,
        y: 0,
      },
      initialYDomain: [1331899068.573772, 1332271544.8197525],
    },
  ],
  zoomLocks: { locksByViewUid: {}, locksDict: {} },
  locationLocks: { locksByViewUid: {}, locksDict: {} },
  valueScaleLocks: { locksByViewUid: {}, locksDict: {} },
};

export default viewconf;
