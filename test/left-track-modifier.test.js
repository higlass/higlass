// @ts-nocheck
import * as vi from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

// Utils
import {
  mountHGComponentAsync,
  removeHGComponent,
} from '../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../app/scripts/utils';

Enzyme.configure({ adapter: new Adapter() });

vi.describe('Left track modifier', () => {
  let hgc = null;
  let div = null;

  vi.beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, zoomLimitViewConf, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  vi.afterAll(() => {
    removeHGComponent(div);
  });

  vi.it('should respect zoom limits', () => {
    // add your tests here

    const trackObj = getTrackObjectFromHGC(hgc.instance(), 'vv', 'tt');

    // trackObj is a LeftTrackModifier that contains the
    // original track
    vi.expect(trackObj.originalTrack.id).to.eql('tt');
  });
});

// enter either a viewconf link or a viewconf object
const zoomLimitViewConf = {
  editable: true,
  zoomFixed: false,
  trackSourceServers: ['//higlass.io/api/v1'],
  exportViewUrl: '/api/v1/viewconfs',
  views: [
    {
      uid: 'vv',

      initialXDomain: [2.9802322387695312e-8, 3099999999.9999995],
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
        left: [
          {
            name: 'Bonev et al. 2017 - GSE96107_CN_H3K27ac',
            created: '2017-12-12T16:58:42.670164Z',
            project: "b'FZKFLh4bQ42x53NJokWJEg'",
            project_name: 'Bonev et al. 2017',
            description: '',
            server: '//higlass.io/api/v1',
            tilesetUid: 'aVKtyKdXRS-pexA2DVdQ1Q',
            uid: 'tt',
            type: 'horizontal-bar',
            options: {
              align: 'bottom',
              labelColor: 'black',
              labelPosition: 'topLeft',
              labelLeftMargin: 0,
              labelRightMargin: 0,
              labelTopMargin: 0,
              labelBottomMargin: 0,
              axisLabelFormatting: 'scientific',
              axisPositionHorizontal: 'right',
              barFillColor: 'darkgreen',
              valueScaling: 'linear',
              trackBorderWidth: 0,
              trackBorderColor: 'black',
              labelTextOpacity: 0.4,
              barOpacity: 1,
              name: 'Bonev et al. 2017 - GSE96107_CN_H3K27ac',
            },
            width: 20,
            height: 20,
            position: 'left',
          },
        ],
        center: [],
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
        i: 'aa',
        moved: false,
        static: false,
      },
      initialYDomain: [996853415.1957023, 2103146584.804298],
    },
  ],
  zoomLocks: {
    locksByViewUid: {},
    locksDict: {},
  },
  locationLocks: {
    locksByViewUid: {},
    locksDict: {},
  },
  valueScaleLocks: {
    locksByViewUid: {},
    locksDict: {},
  },
};
