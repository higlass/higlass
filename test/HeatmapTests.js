// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

// Utils
import {
  mountHGComponent,
  removeHGComponent,
  waitForTilesLoaded,
} from '../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../app/scripts/utils';

import { exportDataConfig } from './view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Heatmaps', () => {
  describe('Visualization', () => {
    let hgc = null;
    let div = null;

    before((done) => {
      [div, hgc] = mountHGComponent(div, hgc, noDataTransform, done, {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true,
      });
    });

    it('should respect zoom limits', () => {
      // add your tests here

      const trackObj = getTrackObjectFromHGC(hgc.instance(), 'v', 'heatmap0');
      const rectData = trackObj.getVisibleRectangleData(547, 18, 1, 1);

      expect(Number.isNaN(rectData.data[0])).to.eql(false);
    });

    after(() => {
      removeHGComponent(div);
    });
  });

  describe('Export heatmap data', () => {
    let hgc = null;
    let div = null;

    before((done) => {
      [div, hgc] = mountHGComponent(div, hgc, exportDataConfig, done, {
        style: 'width:600px;height:1200px;background-color: lightgreen',
        bounded: true,
      });
    });

    it('once', () => {
      const tp = getTrackObjectFromHGC(
        hgc.instance(),
        'NagBzk-AQZuoY0bqG-Yy0Q',
        'PdEzdgsxRymGelD5xfKlNA',
      );
      let data = tp.getVisibleRectangleData(262, 298, 1, 1);

      data = tp.getVisibleRectangleData(
        0,
        0,
        tp.dimensions[0],
        tp.dimensions[1],
      );

      expect(data.shape[0]).to.eql(756);
      expect(data.shape[1]).to.eql(234);

      // tp.exportData();
    });

    after(() => {
      removeHGComponent(div);
    });
  });

  describe('Visualization', () => {
    let hgc = null;
    let div = null;

    before((done) => {
      [div, hgc] = mountHGComponent(div, hgc, viewconf, done, {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true,
      });
    });

    it('should respect zoom limits', () => {
      // add your tests here

      const trackObj = getTrackObjectFromHGC(hgc.instance(), 'vv', 'tt');
      const rectData = trackObj.getVisibleRectangleData(547, 18, 1, 1);

      expect(rectData.shape[0]).to.eql(0);
      expect(rectData.shape[1]).to.eql(0);
    });

    after(() => {
      removeHGComponent(div);
    });
  });

  describe('Triangular-split heatmaps', () => {
    let hgc = null;
    let div = null;

    before((done) => {
      [div, hgc] = mountHGComponent(div, hgc, baseConf, done);
    });

    it('should adjust options when new heatmap is added', () => {
      hgc.instance().handleTrackAdded('v', heatmapTrack, 'center');
      hgc.update();

      const views = JSON.parse(JSON.stringify(hgc.instance().state.views.v));
      const options0 = views.tracks.center[0].contents[0].options;
      const options1 = views.tracks.center[0].contents[1].options;

      expect(views.tracks.center[0].contents.length).to.eql(2);
      expect(options1.backgroundColor).to.eql('transparent');
      expect(options1.showTooltip).to.eql(options0.showTooltip);
      expect(options1.showMousePosition).to.eql(options0.showMousePosition);
      expect(options1.mousePositionColor).to.eql(options0.mousePositionColor);
    });

    it('should adjust position of name and colorbar when extent is triangular', () => {
      const views = JSON.parse(JSON.stringify(hgc.instance().state.views));
      const center = views.v.tracks.center[0];

      const newOptions = {
        ...center.contents[0].options,
        extent: 'lower-left',
      };

      hgc.instance().handleTrackOptionsChanged('v', 'heatmap0', newOptions);
      hgc.update();

      const newViews = JSON.parse(JSON.stringify(hgc.instance().state.views.v));
      const options0 = newViews.tracks.center[0].contents[0].options;
      const options1 = newViews.tracks.center[0].contents[1].options;

      expect(options0.labelPosition).to.eql('bottomLeft');
      expect(options0.colorbarPosition).to.eql('bottomLeft');
      expect(options1.labelPosition).to.eql('topRight');
      expect(options1.colorbarPosition).to.eql('topRight');
    });

    it('tiles on the diagonal should be independent', (done) => {
      const trackObj0 = getTrackObjectFromHGC(hgc.instance(), 'v', 'heatmap0');
      const trackObj1 = getTrackObjectFromHGC(hgc.instance(), 'v', 'heatmap1');

      waitForTilesLoaded(hgc.instance(), () => {
        // hgc.instance().api.zoomToDataExtent('v');
        expect(trackObj0.fetchedTiles['2.1.1.false'].tileData).to.not.eql(
          trackObj1.fetchedTiles['2.1.1.true'].tileData,
        );

        expect(trackObj0.fetchedTiles['2.1.1.false'].tileData.dense).to.not.eql(
          trackObj1.fetchedTiles['2.1.1.true'].tileData.dense,
        );

        done();
      });
    });

    after(() => {
      removeHGComponent(div);
    });
  });
});

// enter either a viewconf link or a viewconf object
const viewconf = {
  editable: true,
  trackSourceServers: ['/api/v1', 'https://higlass.io/api/v1'],
  exportViewUrl: '/api/v1/viewconfs',
  views: [
    {
      initialXDomain: [-2504745106, 1991124761],
      initialYDomain: [-1445835354, 2471358194],
      tracks: {
        top: [
          {
            type: 'top-axis',
          },
        ],
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
                server: 'https://resgen.io/api/v1',
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
                    'black',
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
                  scaleEndPercent: '1.00000',
                },
                width: 100,
                height: 100,
              },
            ],
          },
        ],
        bottom: [],
        right: [],
        whole: [],
        gallery: [],
      },
      layout: {
        w: 12,
        h: 6,
        x: 0,
        y: 0,
      },
      uid: 'vv',
    },
  ],
};

const baseConf = {
  views: [
    {
      uid: 'v',
      tracks: {
        center: [
          {
            type: 'combined',
            contents: [
              {
                server: '//higlass.io/api/v1',
                tilesetUid: 'CQMd6V_cRw6iCI_-Unl3PQ',
                type: 'heatmap',
                uid: 'heatmap0',
                height: 400,
                options: {
                  colorRange: ['white', 'black'],
                  showMousePosition: true,
                  mousePositionColor: 'yellow',
                  showTooltip: true,
                },
              },
            ],
          },
        ],
      },
    },
  ],
};

const noDataTransform = JSON.parse(JSON.stringify(baseConf));
noDataTransform.views[0].tracks.center[0].contents[0].tilesetUid =
  'ZrEuRvzURI6EFw8j0-5GCA';
noDataTransform.views[0].tracks.center[0].contents[0].options.noDataTransform =
  'None';

const heatmapTrack = {
  server: '//higlass.io/api/v1',
  tilesetUid: 'B2LevKBtRNiCMX372rRPLQ',
  type: 'heatmap',
  uid: 'heatmap1',
  height: 400,
  options: { colorRange: ['white', 'black'] },
};
