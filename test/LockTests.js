// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';
import Ajv from 'ajv';

import schema from '../app/schema.json';

// Utils
import {
  mountHGComponent,
  removeHGComponent,
} from '../app/scripts/test-helpers';

Enzyme.configure({ adapter: new Adapter() });

describe('Lock tests', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, viewconf, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  it('should viewconfig be valid', () => {
    const validate = new Ajv().compile(schema);
    const valid = validate(viewconf);
    expect(valid).eql(true);
  });

  it('should have no location locks', () => {
    expect(hgc.instance().locationLocks).to.have.property('v1');
    expect(hgc.instance().locationLocks).not.to.have.property('v2');
  });

  it('should export as SVG', () => {
    // add your tests here

    const svg = hgc.instance().createSVGString();
    expect(svg.length).to.be.above(1);
  });

  it('should change the viewconf', () => {
    const { views } = hgc.instance().state;

    const trackUid = views.v1.tracks.top[0].uid;
    views.v1.tracks.top[0].type = 'horizontal-bar';

    hgc.setState({
      views,
    });

    const trackObj = hgc
      .instance()
      .tiledPlots.v1.trackRenderer.getTrackObject(trackUid);
    expect(trackObj).not.to.eql(null);
  });

  after(() => {
    removeHGComponent(div);
  });
});

// enter either a viewconf link or a viewconf object
const viewconf = {
  editable: true,
  zoomFixed: false,
  views: [
    {
      uid: 'v1',
      initialXDomain: [731363996.8279142, 2368636003.1720853],
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
        top: [
          {
            server: '//higlass.io/api/v1',
            tilesetUid: 'eQkOGi28QFyWzT-s3Axg6g',
            uid: 'LZ6suiMHR6yFnGKY4Ie_YA',
            type: 'horizontal-divergent-bar',
            options: {
              align: 'bottom',
              labelColor: '[glyph-color]',
              labelPosition: 'topLeft',
              labelLeftMargin: 0,
              labelRightMargin: 0,
              labelTopMargin: 0,
              labelBottomMargin: 0,
              labelShowResolution: false,
              labelShowAssembly: true,
              axisLabelFormatting: 'scientific',
              axisPositionHorizontal: 'right',
              barFillColor: 'darkgreen',
              valueScaling: 'linear',
              trackBorderWidth: 0,
              trackBorderColor: 'black',
              labelTextOpacity: 0.4,
              barOpacity: 1,
              name: 'Schwarzer et al (2017) WT Eigenvectors 20K',
              barFillColorBottom: 'red',
              barFillColorTop: 'green',
            },
            width: 20,
            height: 20,
          },
          {
            server: '//higlass.io/api/v1',
            tilesetUid: 'TvzFzi-LQle0nt3OlODEdA',
            uid: 'ccUaq_JTQjSJejoatNtXoA',
            type: 'horizontal-bar',
            options: {
              align: 'bottom',
              labelColor: '[glyph-color]',
              labelPosition: 'topLeft',
              labelLeftMargin: 0,
              labelRightMargin: 0,
              labelTopMargin: 0,
              labelBottomMargin: 0,
              labelShowResolution: false,
              labelShowAssembly: true,
              axisLabelFormatting: 'scientific',
              axisPositionHorizontal: 'right',
              barFillColor: 'darkgreen',
              valueScaling: 'linear',
              trackBorderWidth: 0,
              trackBorderColor: 'black',
              labelTextOpacity: 0.4,
              barOpacity: 1,
              name: 'Schwarzer et al (2017) NIPBL Eigenvectors 20K',
            },
            width: 1890,
            height: 20,
          },
        ],
        left: [],
        center: [
          {
            uid: 'c1',
            type: 'combined',
            height: 608,
            contents: [
              {
                server: '//higlass.io/api/v1',
                tilesetUid: 'CQMd6V_cRw6iCI_-Unl3PQ',
                type: 'heatmap',
                options: {
                  maxZoom: null,
                  labelPosition: 'bottomRight',
                  name: 'Rao et al. (2014) GM12878 MboI (allreps) 1kb',
                  backgroundColor: '#eeeeee',
                  labelLeftMargin: 0,
                  labelRightMargin: 0,
                  labelTopMargin: 0,
                  labelBottomMargin: 0,
                  labelShowResolution: true,
                  labelShowAssembly: true,
                  colorRange: [
                    'white',
                    'rgba(245,166,35,1.0)',
                    'rgba(208,2,27,1.0)',
                    'black',
                  ],
                  colorbarBackgroundColor: '#ffffff',
                  minWidth: 100,
                  minHeight: 100,
                  colorbarPosition: 'topRight',
                  trackBorderWidth: 0,
                  trackBorderColor: 'black',
                  heatmapValueScaling: 'log',
                  showMousePosition: false,
                  mousePositionColor: '#000000',
                  showTooltip: false,
                  extent: 'full',
                  scaleStartPercent: '0.00000',
                  scaleEndPercent: '1.00000',
                },
                uid: 'GjuZed1ySGW1IzZZqFB9BA',
                width: 1321,
                height: 608,
              },
            ],
            options: {},
            width: 1321,
          },
        ],
        right: [],
        bottom: [],
        whole: [],
        gallery: [],
      },
      layout: {
        w: 6,
        h: 12,
        x: 0,
        y: 0,
        moved: false,
        static: false,
      },
      initialYDomain: [802656621.7287865, 2297343378.2712135],
    },
    {
      uid: 'v2',
      initialXDomain: [-8321570.2394923, 2469429.5836635],
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
                server: '//higlass.io/api/v1',
                tilesetUid: 'CQMd6V_cRw6iCI_-Unl3PQ',
                type: 'heatmap',
                uid: 'GjuZed1ySGW1IzZZqFB9BA',
                transforms: [
                  {
                    name: 'ICE',
                    value: 'weight',
                  },
                ],
                width: 1321,
                height: 608,
              },
            ],
            options: {},
            width: 1321,
          },
        ],
        right: [],
        bottom: [],
        whole: [],
        gallery: [],
      },
      layout: {
        w: 6,
        h: 12,
        x: 6,
        y: 0,
        moved: false,
        static: false,
      },
    },
  ],
  zoomLocks: {
    locksByViewUid: {},
    locksDict: {},
  },
  locationLocks: {
    locksByViewUid: {
      v1: 'CXoiuATHTaSgl8vS7cfN9Q',
      v2: 'CXoiuATHTaSgl8vS7cfN9Q',
    },
    locksDict: {
      CXoiuATHTaSgl8vS7cfN9Q: {
        v1: [260987233.96627533, 260946896.30846155, 1028.5273218750954],
      },
    },
  },
  valueScaleLocks: {
    locksByViewUid: {
      'v1.ccUaq_JTQjSJejoatNtXoA': 'Qx-F3xOESVW3ZKX7UFneFQ',
      'v1.TL18hD7kSomz_Ne_dJe0Zw': 'Qx-F3xOESVW3ZKX7UFneFQ',
    },
    locksDict: {
      'Qx-F3xOESVW3ZKX7UFneFQ': {
        'v1.ccUaq_JTQjSJejoatNtXoA': {
          view: 'v1',
          track: 'ccUaq_JTQjSJejoatNtXoA',
        },
        'v1.TL18hD7kSomz_Ne_dJe0Zw': {
          view: 'v1',
          track: 'TL18hD7kSomz_Ne_dJe0Zw',
        },
        uid: 'Qx-F3xOESVW3ZKX7UFneFQ',
      },
    },
  },
};
