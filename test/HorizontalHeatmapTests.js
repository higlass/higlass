// @ts-nocheck
/* eslint-env mocha */
import {
  configure,
  // render,
} from 'enzyme';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

import { expect } from 'chai';

// Utils
import {
  mountHGComponent,
  removeHGComponent,
} from '../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../app/scripts/utils';

configure({ adapter: new Adapter() });

describe('Horizontal heatmaps', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, zoomLimitViewConf, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  it('should respect zoom limits', () => {
    // make sure that the correct zoom level is returned when a zoom
    // limit is set

    const trackObj = getTrackObjectFromHGC(hgc.instance(), 'vv', 'tt');
    expect(trackObj.calculateZoomLevel()).to.eql(1);
  });

  after(() => {
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
              colorRange: [
                'white',
                'rgba(245,166,35,1.0)',
                'rgba(208,2,27,1.0)',
                'black',
              ],
              maxZoom: '1',
              trackBorderWidth: 0,
              trackBorderColor: 'black',
              name: 'Dekker Lab HFFc6 DpnII',
            },
            width: 570,
            height: 101,
          },
        ],
        left: [],
        center: [],
        right: [],
        bottom: [],
        whole: [],
        gallery: [],
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
        static: false,
      },
      uid: 'vv',
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
