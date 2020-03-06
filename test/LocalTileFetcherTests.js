/* eslint-env node, jasmine */
import {
  configure
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

// Utils
import {
  mountHGComponent,
  removeHGComponent,
  getTrackObjectFromHGC
} from '../app/scripts/utils';

configure({ adapter: new Adapter() });

describe('Horizontal heatmaps', () => {
  let hgc = null;
  let div = null;

  beforeAll(done => {
    [div, hgc] = mountHGComponent(div, hgc, viewconf, done, {
      style: 'width:600px; height:400px; background-color: lightgreen',
      bounded: true
    });
  });

  it('should respect zoom limits', () => {
    const trackObj = getTrackObjectFromHGC(hgc.instance(), 'vv', 'tt');

    expect(trackObj.allTexts.length).to.be.above(0);
    expect(trackObj.allTexts[0].caption).to.eql('SEMA3A');
  });

  afterAll(() => {
    removeHGComponent(div);
  });
});

// enter either a viewconf link or a viewconf object
const viewconf = {
  editable: true,
  zoomFixed: false,
  trackSourceServers: [
    '//higlass.io/api/v1',
    'https://resgen.io/api/v1/gt/paper-data'
  ],
  exportViewUrl: '/api/v1/viewconfs',
  views: [
    {
      uid: 'vv',
      initialXDomain: [1317287678.041166, 1317418424.0815825],
      autocompleteSource: '/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&',
      genomePositionSearchBox: {
        autocompleteServer: '//higlass.io/api/v1',
        autocompleteId: 'OHJakQICQD6gTD7skx4EWA',
        chromInfoServer: '//higlass.io/api/v1',
        chromInfoId: 'hg19',
        visible: true
      },
      chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
      tracks: {
        top: [
          {
            type: 'horizontal-gene-annotations',
            height: 60,
            data: {
              type: 'local-tiles',
              tilesetInfo: {
                OHJakQICQD6gTD7skx4EWA: {
                  zoom_step: 1,
                  max_length: 3137161264,
                  assembly: 'hg19',
                  chrom_names:
                    'chr1\tchr2\tchr3\tchr4\tchr5\tchr6\tchr7\tchr8\tchr9\tchr10\tchr11\tchr12\tchr13\tchr14\tchr15\tchr16\tchr17\tchr18\tchr19\tchr20\tchr21\tchr22\tchrX\tchrY\tchrM',
                  chrom_sizes:
                    '249250621\t243199373\t198022430\t191154276\t180915260\t171115067\t159138663\t146364022\t141213431\t135534747\t135006516\t133851895\t115169878\t107349540\t102531392\t90354753\t81195210\t78077248\t59128983\t63025520\t48129895\t51304566\t155270560\t59373566\t16571',
                  tile_size: 1024.0,
                  max_zoom: 22,
                  max_width: 4294967296.0,
                  min_pos: [1],
                  max_pos: [3137161264],
                  header: '',
                  name: 'Gene Annotations (hg19)',
                  datatype: 'gene-annotation',
                  coordSystem: 'hg19',
                  coordSystem2: ''
                }
              },
              tiles: {
                'OHJakQICQD6gTD7skx4EWA.16.20101': [
                  {
                    xStart: 1317244685,
                    xEnd: 1317481244,
                    chrOffset: 1233657027,
                    importance: 111.0,
                    uid: 'WepfdWoIS9qSTmH9r9QUuQ',
                    fields: [
                      'chr7',
                      '83587658',
                      '83824217',
                      'SEMA3A',
                      '111',
                      '-',
                      'union_10371',
                      '10371',
                      'protein-coding',
                      'semaphorin 3A',
                      '83590686',
                      '83823902',
                      '83587658,83592520,83606447,83610636,83614751,83631270,83634654,83636668,83640337,83640498,83643524,83675639,83689780,83739785,83758438,83764109,83823790',
                      '83591142,83592663,83606512,83610794,83614793,83631362,83634874,83636813,83640407,83640613,83643667,83675759,83689874,83739905,83758501,83764267,83824217'
                    ]
                  }
                ],
                'OHJakQICQD6gTD7skx4EWA.16.20102': [
                  {
                    xStart: 1317244685,
                    xEnd: 1317481244,
                    chrOffset: 1233657027,
                    importance: 111.0,
                    uid: 'WepfdWoIS9qSTmH9r9QUuQ',
                    fields: [
                      'chr7',
                      '83587658',
                      '83824217',
                      'SEMA3A',
                      '111',
                      '-',
                      'union_10371',
                      '10371',
                      'protein-coding',
                      'semaphorin 3A',
                      '83590686',
                      '83823902',
                      '83587658,83592520,83606447,83610636,83614751,83631270,83634654,83636668,83640337,83640498,83643524,83675639,83689780,83739785,83758438,83764109,83823790',
                      '83591142,83592663,83606512,83610794,83614793,83631362,83634874,83636813,83640407,83640613,83643667,83675759,83689874,83739905,83758501,83764267,83824217'
                    ]
                  }
                ],
                'OHJakQICQD6gTD7skx4EWA.16.20100': [
                  {
                    xStart: 1317244685,
                    xEnd: 1317481244,
                    chrOffset: 1233657027,
                    importance: 111.0,
                    uid: 'WepfdWoIS9qSTmH9r9QUuQ',
                    fields: [
                      'chr7',
                      '83587658',
                      '83824217',
                      'SEMA3A',
                      '111',
                      '-',
                      'union_10371',
                      '10371',
                      'protein-coding',
                      'semaphorin 3A',
                      '83590686',
                      '83823902',
                      '83587658,83592520,83606447,83610636,83614751,83631270,83634654,83636668,83640337,83640498,83643524,83675639,83689780,83739785,83758438,83764109,83823790',
                      '83591142,83592663,83606512,83610794,83614793,83631362,83634874,83636813,83640407,83640613,83643667,83675759,83689874,83739905,83758501,83764267,83824217'
                    ]
                  }
                ]
              }
            },
            uid: 'tt',
            options: {
              name: 'Gene Annotations (hg19)',
              fontSize: 10,
              labelColor: 'black',
              labelBackgroundColor: '#ffffff',
              labelPosition: 'hidden',
              labelLeftMargin: 0,
              labelRightMargin: 0,
              labelTopMargin: 0,
              labelBottomMargin: 0,
              minHeight: 24,
              plusStrandColor: 'blue',
              minusStrandColor: 'red',
              trackBorderWidth: 0,
              trackBorderColor: 'black',
              showMousePosition: false,
              mousePositionColor: '#000000',
              geneAnnotationHeight: 12,
              geneLabelPosition: 'outside',
              geneStrandSpacing: 4
            },
            width: 1324
          }
        ],
        left: [],
        center: [],
        right: [],
        bottom: [],
        whole: [],
        gallery: []
      },
      layout: {
        w: 12,
        h: 3,
        x: 0,
        y: 0,
        moved: false,
        static: false
      },
      initialYDomain: [516818600.11284065, 516820825.57735837]
    }
  ],
  zoomLocks: {
    locksByViewUid: {},
    locksDict: {}
  },
  locationLocks: {
    locksByViewUid: {},
    locksDict: {}
  },
  valueScaleLocks: {
    locksByViewUid: {},
    locksDict: {}
  }
};
