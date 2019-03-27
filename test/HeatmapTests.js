/* eslint-env node, jasmine */
import {
  configure,
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

import {
  exportDataConfig
} from './view-configs';

configure({ adapter: new Adapter() });

describe('Testing', () => {
  describe('Export heatmap data', () => {
    let hgc = null;
    let div = null;

    beforeAll((done) => {
      ([div, hgc] = mountHGComponent(div, hgc,
        exportDataConfig,
        done,
        {
          style: 'width:600px;height:1200px;background-color: lightgreen',
          bounded: true,
        })
      );
    });

    it('once', (done) => {
      const tp = getTrackObjectFromHGC(hgc.instance(), 'NagBzk-AQZuoY0bqG-Yy0Q', 'PdEzdgsxRymGelD5xfKlNA');
      let data = tp.getVisibleRectangleData(262, 298, 1, 1);

      data = tp.getVisibleRectangleData(0, 0, tp.dimensions[0], tp.dimensions[1]);

      expect(data.shape[0]).to.eql(756);
      expect(data.shape[1]).to.eql(234);

      // tp.exportData();

      done();
    });

    afterAll((done) => {
      removeHGComponent(div);

      done();
    });
  });

  describe('Heatmaps', () => {
    let hgc = null;
    let div = null;

    beforeAll((done) => {
      ([div, hgc] = mountHGComponent(div, hgc,
        viewconf,
        done,
        {
          style: 'width:800px; height:400px; background-color: lightgreen',
          bounded: true,
        })
      );
    });

    it('should respect zoom limits', (done) => {
      // add your tests here

      const trackObj = getTrackObjectFromHGC(hgc.instance(), 'vv', 'tt');
      const rectData = trackObj.getVisibleRectangleData(547, 18, 1, 1);

      expect(rectData.shape[0]).to.eql(0);
      expect(rectData.shape[1]).to.eql(0);

      done();
    });

    afterAll((done) => {
      removeHGComponent(div);

      done();
    });
  });
});

// enter either a viewconf link or a viewconf object
const viewconf = {
  editable: true,
  trackSourceServers: [
    '/api/v1',
    'http://higlass.io/api/v1'
  ],
  exportViewUrl: '/api/v1/viewconfs',
  views: [
    {
      initialXDomain: [
        -2504745106.5753083,
        1991124761.6042666
      ],
      initialYDomain: [
        -1445835354.3018048,
        2471358194.211092
      ],
      tracks: {
        top: [{
          type: 'top-axis'
        }],
        left: [],
        center: [
          {
            uid: 'efmQMxkZSrug9yQ7AyE4aQ',
            type: 'combined',
            contents: [
              {
                type: 'heatmap',
                uid: 'tt',
                tilesetUid: 'Bu6Djvt9T_mgZPHLig3NfQ',
                server: 'http://resgen.io/api/v1',
                options: {
                  backgroundColor: '#eeeeee',
                  labelPosition: 'bottomRight',
                  labelLeftMargin: 0,
                  labelRightMargin: 0,
                  labelTopMargin: 0,
                  labelBottomMargin: 0,
                  colorRange: [
                    'white',
                    'rgba(245,166,35,1.0)',
                    'rgba(208,2,27,1.0)',
                    'black'
                  ],
                  maxZoom: null,
                  colorbarPosition: 'topRight',
                  trackBorderWidth: 0,
                  trackBorderColor: 'black',
                  heatmapValueScaling: 'log',
                  showMousePosition: false,
                  mousePositionColor: '#999999',
                  showTooltip: false,
                  name: 'blah_all.h5',
                  scaleStartPercent: '0.00000',
                  scaleEndPercent: '1.00000'
                },
                width: 100,
                height: 100,
                name: 'blah_all.h5',
                resolutions: [
                  1,
                  128,
                  16,
                  2,
                  256,
                  32,
                  4,
                  512,
                  64,
                  8
                ],
                position: 'center'
              }
            ],
            position: 'center',
            options: {}
          }
        ],
        bottom: [],
        right: [],
        whole: [],
        gallery: []
      },
      layout: {
        w: 12,
        h: 6,
        x: 0,
        y: 0,
        i: 'KlNmjr0BQgWGhSZB0MNIEg',
        moved: false,
        static: false
      },
      uid: 'vv'
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
