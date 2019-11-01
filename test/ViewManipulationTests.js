/* eslint-env node, jasmine, mocha */
import {
  configure
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

// Utils
import { mountHGComponent, removeHGComponent, waitForTilesLoaded } from '../app/scripts/utils';

import { emptyConf } from './view-configs';

configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let hgc = null;
  let div = null;

  describe('Viewconf change tests', () => {
    beforeAll(done => {
      [div, hgc] = mountHGComponent(div, hgc, valueScaleLocksConf, done, {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true
      });
    });

    it('ensures that valueScaleLocks are removed when the viewconf changes', () => {
      const newViews = hgc.instance().processViewConfig(emptyConf);
      hgc.setState({
        views: newViews
      });

      expect(Object.keys(hgc.instance().valueScaleLocks).length).to.eql(0);
    });

    // afterAll(() => {
    //   // removeHGComponent(div);
    // });
  });

  describe('Viewport projection tests', () => {
    beforeAll(done => {
      [div, hgc] = mountHGComponent(
        div,
        hgc,
        'http://higlass.io/api/v1/viewconfs/?d=KaeBVQQpTaqT0kfhE32boQ',
        done,
        {
          style: 'width:800px; height:400px; background-color: lightgreen',
          bounded: true
        }
      );
    });

    it("Ensure that the viewport projection's borders are black", done => {
      hgc.instance().handleAddView(Object.values(hgc.instance().state.views)[0]);

      waitForTilesLoaded(hgc.instance(), () => {
        const views = Object.values(hgc.instance().state.views);

        // make sure the width of the view has been halved
        expect(views[0].layout.w).to.eql(6);
        expect(views[1].layout.w).to.eql(6);

        done();
      });
    });

    afterAll(() => {
      removeHGComponent(div);
    });
  });
});

const valueScaleLocksConf = {
  editable: true,
  trackSourceServers: ['/api/v1', 'http://higlass.io/api/v1'],
  exportViewUrl: '/api/v1/viewconfs',
  views: [
    {
      tracks: {
        center: [
          {
            uid: 'bEcWwkuDT-OI5yKSpDrBSQ',
            type: 'combined',
            contents: [
              {
                name: 'Dekker Lab HFFc6 DpnII',
                created: '2018-04-24T14:27:13.612205Z',
                project: "b'cL3CA5-MRTWdTmagn0Y_PA'",
                project_name: '4DN',
                description: '',
                server: 'http://higlass.io/api/v1',
                tilesetUid: 'D_8CofpyQoCqDqeA-A6A4g',
                uid: 'M2cJVMQBQ_aoJm1iarEi4g',
                type: 'heatmap',
                options: {
                  backgroundColor: '#eeeeee',
                  labelPosition: 'bottomRight',
                  labelLeftMargin: 0,
                  labelRightMargin: 0,
                  labelTopMargin: 0,
                  labelBottomMargin: 0,
                  colorRange: ['white', 'rgba(245,166,35,1.0)', 'rgba(208,2,27,1.0)', 'black'],
                  maxZoom: null,
                  colorbarPosition: 'topRight',
                  trackBorderWidth: 0,
                  trackBorderColor: 'black',
                  heatmapValueScaling: 'log',
                  showMousePosition: false,
                  mousePositionColor: '#999999',
                  showTooltip: false,
                  name: 'Dekker Lab HFFc6 DpnII',
                  scaleStartPercent: '0.00000',
                  scaleEndPercent: '1.00000'
                },
                width: 100,
                height: 100,
                transforms: [
                  {
                    name: 'KR',
                    value: 'KR'
                  },
                  {
                    name: 'VC',
                    value: 'VC'
                  },
                  {
                    name: 'VC_SQRT',
                    value: 'VC_SQRT'
                  },
                  {
                    name: 'ICE',
                    value: 'weight'
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
                position: 'center'
              }
            ],
            position: 'center',
            options: {}
          }
        ],
        left: [],
        right: [],
        top: [],
        bottom: [],
        whole: [],
        gallery: []
      },
      uid: 'Pqm9bvPORbCO-CsWqj9NWA',
      initialXDomain: [756110896.9831955, 2300280223.2089314],
      initialYDomain: [1284286290.3753738, 1729007056.3283863],
      layout: {
        w: 6,
        h: 4,
        x: 0,
        y: 0,
        i: 'Pqm9bvPORbCO-CsWqj9NWA',
        moved: false,
        static: false
      }
    },
    {
      tracks: {
        center: [
          {
            uid: 'bEcWwkuDT-OI5yKSpDrBSQ',
            type: 'combined',
            contents: [
              {
                name: 'Dekker Lab HFFc6 DpnII',
                created: '2018-04-24T14:27:13.612205Z',
                project: "b'cL3CA5-MRTWdTmagn0Y_PA'",
                project_name: '4DN',
                description: '',
                server: 'http://higlass.io/api/v1',
                tilesetUid: 'D_8CofpyQoCqDqeA-A6A4g',
                uid: 'M2cJVMQBQ_aoJm1iarEi4g',
                type: 'heatmap',
                options: {
                  backgroundColor: '#eeeeee',
                  labelPosition: 'bottomRight',
                  labelLeftMargin: 0,
                  labelRightMargin: 0,
                  labelTopMargin: 0,
                  labelBottomMargin: 0,
                  colorRange: ['white', 'rgba(245,166,35,1.0)', 'rgba(208,2,27,1.0)', 'black'],
                  maxZoom: null,
                  colorbarPosition: 'topRight',
                  trackBorderWidth: 0,
                  trackBorderColor: 'black',
                  heatmapValueScaling: 'log',
                  showMousePosition: false,
                  mousePositionColor: '#999999',
                  showTooltip: false,
                  name: 'Dekker Lab HFFc6 DpnII',
                  scaleStartPercent: '0.00000',
                  scaleEndPercent: '1.00000'
                },
                width: 100,
                height: 100,
                transforms: [
                  {
                    name: 'KR',
                    value: 'KR'
                  },
                  {
                    name: 'VC',
                    value: 'VC'
                  },
                  {
                    name: 'VC_SQRT',
                    value: 'VC_SQRT'
                  },
                  {
                    name: 'ICE',
                    value: 'weight'
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
                position: 'center'
              }
            ],
            position: 'center',
            options: {}
          }
        ],
        left: [],
        right: [],
        top: [],
        bottom: [],
        whole: [],
        gallery: []
      },
      uid: 'QuBlHOXDTbKqIqDk9X4FIA',
      initialXDomain: [756110896.9831983, 2300280223.2089286],
      initialYDomain: [1284286290.375375, 1729007056.3283854],
      layout: {
        w: 6,
        h: 4,
        x: 6,
        y: 0,
        i: 'QuBlHOXDTbKqIqDk9X4FIA',
        moved: false,
        static: false
      }
    }
  ],
  zoomLocks: {
    locksByViewUid: {
      QuBlHOXDTbKqIqDk9X4FIA: 'K6tRxnTUTMmZ-DLC0RlVIw',
      'Pqm9bvPORbCO-CsWqj9NWA': 'K6tRxnTUTMmZ-DLC0RlVIw'
    },
    locksDict: {
      'K6tRxnTUTMmZ-DLC0RlVIw': {
        QuBlHOXDTbKqIqDk9X4FIA: [1544134916.5, 1544134916.5, 4010740.040259719],
        'Pqm9bvPORbCO-CsWqj9NWA': [1544134916.5, 1544134916.5, 4010740.040259719],
        uid: 'K6tRxnTUTMmZ-DLC0RlVIw'
      }
    }
  },
  locationLocks: {
    locksByViewUid: {
      QuBlHOXDTbKqIqDk9X4FIA: 'Dss0P1dCQKCQdzsatsOY7A',
      'Pqm9bvPORbCO-CsWqj9NWA': 'Dss0P1dCQKCQdzsatsOY7A'
    },
    locksDict: {
      Dss0P1dCQKCQdzsatsOY7A: {
        QuBlHOXDTbKqIqDk9X4FIA: [1544134916.5, 1544134916.5, 4010740.040259719],
        'Pqm9bvPORbCO-CsWqj9NWA': [1544134916.5, 1544134916.5, 4010740.040259719],
        uid: 'Dss0P1dCQKCQdzsatsOY7A'
      }
    }
  },
  valueScaleLocks: {
    locksByViewUid: {
      'QuBlHOXDTbKqIqDk9X4FIA.M2cJVMQBQ_aoJm1iarEi4g': 'MW8MbmnUS9SdPR18vi1jfw',
      'Pqm9bvPORbCO-CsWqj9NWA.M2cJVMQBQ_aoJm1iarEi4g': 'MW8MbmnUS9SdPR18vi1jfw'
    },
    locksDict: {
      MW8MbmnUS9SdPR18vi1jfw: {
        'QuBlHOXDTbKqIqDk9X4FIA.M2cJVMQBQ_aoJm1iarEi4g': {
          view: 'QuBlHOXDTbKqIqDk9X4FIA',
          track: 'M2cJVMQBQ_aoJm1iarEi4g'
        },
        'Pqm9bvPORbCO-CsWqj9NWA.M2cJVMQBQ_aoJm1iarEi4g': {
          view: 'Pqm9bvPORbCO-CsWqj9NWA',
          track: 'M2cJVMQBQ_aoJm1iarEi4g'
        },
        uid: 'MW8MbmnUS9SdPR18vi1jfw'
      }
    }
  }
};
