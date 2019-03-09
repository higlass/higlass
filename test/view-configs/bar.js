const viewconfig = {
  zoomFixed: false,
  views: [
    {
      layout: {
        w: 12,
        h: 6,
        x: 0,
        y: 0,
        i: 'aa',
        moved: false,
        static: false
      },
      uid: 'aa',
      initialYDomain: [2541320068.253662, 2541325651.38588],
      initialXDomain: [2540172918.0011406, 2540208277.8385234],
      tracks: {
        left: [],
        top: [
          {
            uid: 'bar1',
            tilesetUid: 'PjIJKXGbSNCalUZO21e_HQ',
            height: 48,
            server: '//higlass.io/api/v1',
            type: 'horizontal-bar',
            options: {
              name: 'GM12878-E116-H3K27ac.fc.signal',
              barFillColor: 'blue',
              axisPositionHorizontal: 'right',
              labelColor: 'black',
              labelTextOpacity: 1,
              demarcationLine: true,
              demarcationLineColor: 'red',
              demarcationLineOpacity: 0.5
            }
          }
        ]
      },
      chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv'
    }
  ],
  editable: true,
  exportViewUrl: '/api/v1/viewconfs',
  trackSourceServers: [
    '//higlass.io/api/v1'
  ]
};
export default viewconfig;
