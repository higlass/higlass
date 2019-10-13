/* eslint-env node, jasmine */
import {
  configure,
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

// Utils
import {
  mountHGComponent,
  removeHGComponent,
  getTrackObjectFromHGC,
} from '../app/scripts/utils';

// View configs
import horizontalMultivecWithSmallerDimensions from './view-configs-more/horizontalMultivecWithSmallerDimensions';

// Constants
import {
  MIN_HORIZONTAL_HEIGHT,
  MIN_VERTICAL_WIDTH,
} from '../app/scripts/configs';

configure({ adapter: new Adapter() });

describe('Horizontal heatmaps', () => {
  let hgc = null;
  let div = null;

  beforeAll((done) => {
    ([div, hgc] = mountHGComponent(div, hgc,
      viewConf1,
      done,
      {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true,
      })
    );
  });

  // it('not have errors in the loaded viewconf', (done) => {
  //   done();
  // });

  it('Test horizontal multivec with track containing smaller-than-default width and height', (done) => {
    ([div, hgc] = mountHGComponent(div, hgc,
      horizontalMultivecWithSmallerDimensions,
      () => {
        const track = getTrackObjectFromHGC(hgc.instance(), 'viewConf2_uid', 'K_0GxgCvQfCHM56neOnHKg'); // uuid of horizontal-multivec
        const width = track.dimensions[0];
        const height = track.dimensions[1];
        if (height === MIN_HORIZONTAL_HEIGHT || width === MIN_VERTICAL_WIDTH) return;
        done();
      },
      {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true,
      })
    );
  });

  afterAll(() => {
    removeHGComponent(div);
  });
});

const viewConf1 = {
  zoomFixed: false,
  views: [
    {
      layout: {
        w: 12,
        h: 9,
        x: 0,
        y: 0,
        i: 'aa',
        moved: false,
        static: false
      },
      uid: 'aa',
      initialYDomain: [
        2936293269.9661727,
        3260543052.0694017
      ],
      autocompleteSource: '/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&',
      initialXDomain: [
        -1109178825.081832,
        3692212179.1390653
      ],
      tracks: {
        left: [],
        top: [
          {
            uid: 'genes',
            tilesetUid: 'OHJakQICQD6gTD7skx4EWA',
            position: 'top',
            server: 'http://higlass.io/api/v1',
            type: 'horizontal-gene-annotations',
            height: 48,
            options: {
              labelColor: 'black',
              plusStrandColor: 'black',
              name: 'Gene Annotations (hg19)',
              labelPosition: 'hidden',
              minusStrandColor: 'black',
              fontSize: 11,
              trackBorderWidth: 0,
              trackBorderColor: 'black',
              showMousePosition: true,
              mousePositionColor: '#000000',
              geneAnnotationHeight: 10,
              geneLabelPosition: 'outside',
              geneStrandSpacing: 4,
              labelLeftMargin: 0,
              labelRightMargin: 0,
              labelTopMargin: 0,
              labelBottomMargin: 0
            },
            name: 'Gene Annotations (hg19)',
            header: '',
            width: 793
          },
          {
            uid: 'R_trrhWOQG2UcXvAutdl7Q',
            tilesetUid: 'PjIJKXGbSNCalUZO21e_HQ',
            height: 20,
            width: 793,
            position: 'top',
            server: 'http://higlass.io/api/v1',
            type: 'horizontal-vector-heatmap',
            options: {
              name: 'GM12878-E116-H3K27ac.fc.signal',
              valueScaling: 'linear',
              lineStrokeWidth: 2,
              lineStrokeColor: '#4a35fc',
              labelPosition: 'topLeft',
              labelColor: 'black',
              axisPositionHorizontal: 'right',
              trackBorderWidth: 0,
              trackBorderColor: 'black',
              labelTextOpacity: 0.4,
              showMousePosition: true,
              mousePositionColor: '#000000',
              showTooltip: false,
              labelLeftMargin: 0,
              labelRightMargin: 0,
              labelTopMargin: 0,
              labelBottomMargin: 0,
              axisLabelFormatting: 'scientific',
              heatmapValueScaling: 'log'
            },
            name: 'GM12878-E116-H3K27ac.fc.signal'
          },
          {
            name: 'Epilogos (hg19)',
            created: '2018-07-07T23:40:51.460644Z',
            project: null,
            project_name: '',
            description: '',
            server: '//higlass.io/api/v1',
            tilesetUid: 'ClhFclOOQMWKSebXaXItoA',
            uid: 'E11eXWkwRb22aKBbj_45_A',
            type: 'horizontal-vector-heatmap',
            options: {
              labelPosition: 'topLeft',
              labelColor: 'black',
              labelTextOpacity: 0.4,
              valueScaling: 'exponential',
              trackBorderWidth: 0,
              trackBorderColor: 'black',
              backgroundColor: 'white',
              barBorder: true,
              sortLargestOnTop: true,
              colorScale: [
                '#FF0000',
                '#FF4500',
                '#32CD32',
                '#008000',
                '#006400',
                '#C2E105',
                '#FFFF00',
                '#66CDAA',
                '#8A91D0',
                '#CD5C5C',
                '#E9967A',
                '#BDB76B',
                '#808080',
                '#C0C0C0',
                '#FFFFFF'
              ],
              name: 'Epilogos (hg19)',
              labelLeftMargin: 0,
              labelRightMargin: 0,
              labelTopMargin: 0,
              labelBottomMargin: 0,
              heatmapValueScaling: 'log'
            },
            width: 770,
            height: 153,
            resolutions: [
              13107200,
              6553600,
              3276800,
              1638400,
              819200,
              409600,
              204800,
              102400,
              51200,
              25600,
              12800,
              6400,
              3200,
              1600,
              800,
              400,
              200
            ],
            position: 'top'
          },
          {
            uid: 'chroms',
            height: 35,
            width: 793,
            chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
            position: 'top',
            type: 'horizontal-chromosome-labels',
            options: {
              color: '#777777',
              stroke: '#FFFFFF',
              fontSize: 11,
              fontIsLeftAligned: true,
              showMousePosition: true,
              mousePositionColor: '#000000',
              fontIsAligned: false
            },
            name: 'Chromosome Labels (hg19)'
          }
        ],
        right: [],
        center: [],
        bottom: [],
        whole: [],
        gallery: []
      },
      chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
      genomePositionSearchBoxVisible: false,
      genomePositionSearchBox: {
        visible: true,
        chromInfoServer: 'http://higlass.io/api/v1',
        chromInfoId: 'hg19',
        autocompleteServer: 'http://higlass.io/api/v1',
        autocompleteId: 'OHJakQICQD6gTD7skx4EWA'
      }
    }
  ],
  editable: true,
  viewEditable: true,
  tracksEditable: true,
  exportViewUrl: '/api/v1/viewconfs',
  zoomLocks: {
    locksByViewUid: {},
    locksDict: {}
  },
  trackSourceServers: [
    'http://higlass.io/api/v1'
  ],
  locationLocks: {
    locksByViewUid: {
      aa: 'PkNgAl3mSIqttnSsCewngw',
      ewZvJwlDSei_dbpIAkGMlg: 'PkNgAl3mSIqttnSsCewngw'
    },
    locksDict: {
      PkNgAl3mSIqttnSsCewngw: {
        aa: [
          1550000000,
          1550000000,
          3380588.876772046
        ],
        ewZvJwlDSei_dbpIAkGMlg: [
          1550000000.0000002,
          1549999999.9999993,
          3380588.876772046
        ],
        uid: 'PkNgAl3mSIqttnSsCewngw'
      }
    }
  },
  valueScaleLocks: {
    locksByViewUid: {},
    locksDict: {}
  }
};
