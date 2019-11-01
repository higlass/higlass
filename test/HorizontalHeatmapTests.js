/* eslint-env node, jasmine */
import {
  configure
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

// Utils
import { mountHGComponent, removeHGComponent, getTrackObjectFromHGC } from '../app/scripts/utils';

configure({ adapter: new Adapter() });

describe('Horizontal heatmaps', () => {
  let hgc = null;
  let div = null;

  beforeAll(done => {
    [div, hgc] = mountHGComponent(div, hgc, zoomLimitViewConf, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true
    });
  });

  it('should respect zoom limits', () => {
    // make sure that the correct zoom level is returned when a zoom
    // limit is set

    const trackObj = getTrackObjectFromHGC(hgc.instance(), 'vv', 'tt');
    expect(trackObj.calculateZoomLevel()).to.eql(1);
  });

  afterAll(() => {
    removeHGComponent(div);
  });
});

// enter either a viewconf link or a viewconf object here
const zoomLimitViewConf = {
  editable: true,
  zoomFixed: false,
  trackSourceServers: ['/api/v1', 'http://higlass.io/api/v1'],
  exportViewUrl: '/api/v1/viewconfs/',
  views: [
    {
      tracks: {
        top: [
          {
            name: 'Dekker Lab HFFc6 DpnII',
            created: '2018-04-24T14:27:13.612205Z',
            project: null,
            project_name: '',
            description: '',
            server: 'http://higlass.io/api/v1',
            tilesetUid: 'D_8CofpyQoCqDqeA-A6A4g',
            uid: 'tt',
            type: 'horizontal-heatmap',
            options: {
              backgroundColor: '#eeeeee',
              labelPosition: 'bottomRight',
              labelLeftMargin: 0,
              labelRightMargin: 0,
              labelTopMargin: 0,
              labelBottomMargin: 0,
              labelColor: 'black',
              colorRange: ['white', 'rgba(245,166,35,1.0)', 'rgba(208,2,27,1.0)', 'black'],
              maxZoom: '1',
              trackBorderWidth: 0,
              trackBorderColor: 'black',
              name: 'Dekker Lab HFFc6 DpnII'
            },
            width: 570,
            height: 101,
            transforms: [
              {
                name: 'VC_SQRT',
                value: 'VC_SQRT'
              },
              {
                name: 'KR',
                value: 'KR'
              },
              {
                name: 'ICE',
                value: 'weight'
              },
              {
                name: 'VC',
                value: 'VC'
              }
            ],
            resolutions: [
              1000,
              2000,
              5000,
              10000,
              25000,
              50000,
              100000,
              250000,
              500000,
              1000000,
              2500000,
              5000000,
              10000000
            ],
            position: 'top'
          }
        ],
        left: [],
        center: [],
        right: [],
        bottom: [],
        whole: [],
        gallery: []
      },
      initialXDomain: [645722545.1231897, 676259976.4728326],
      initialYDomain: [661682163.429321, 662057184.5160711],
      layout: {
        w: 12,
        h: 4,
        x: 0,
        y: 0,
        i: 'JuRe7t2TRtWEUxBpR92gcw',
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
