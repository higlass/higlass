/* eslint-env node, jasmine, mocha */
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


configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let hgc = null;
  let div = null;

  describe('BedLikeTrack tests', () => {
    beforeAll((done) => {
      ([div, hgc] = mountHGComponent(div, hgc, viewConf, done));
    });

    it('Ensures that the track was rendered', () => {
      expect(hgc.instance().state.viewConfig.editable).to.eql(true);
      const trackObj = getTrackObjectFromHGC(hgc.instance(),
        viewConf.views[0].uid,
        viewConf.views[0].tracks.top[0].uid);

      expect(Object.keys(trackObj.drawnRects).length).to.be.above(0);
    });

    it('Checks that + and - strand entries are at different heights', () => {
      const trackObj = getTrackObjectFromHGC(hgc.instance(),
        viewConf.views[0].uid,
        viewConf.views[0].tracks.top[0].uid);

      const rectHeights = new Set();
      for (const tileId in trackObj.drawnRects) {
        for (const uid in trackObj.drawnRects[tileId]) {
          const rect = trackObj.drawnRects[tileId][uid];

          rectHeights.add(rect[0][3]);
        }
      }

      expect(rectHeights.size).to.eql(2);
    });


    it('Exports to SVG', () => {
      const svgText = hgc.instance().createSVGString();

      const textIx = svgText.indexOf('text');
      const greenIx = svgText.indexOf('green');

      expect(textIx).to.be.above(0);
      expect(greenIx).to.be.below(0);
    });

    it('Checks minusStrandColor', (done) => {
      hgc.instance().state.views.aa.tracks.top[0].options.minusStrandColor = 'green';

      hgc.setState(hgc.instance().state);
      hgc.update();

      const svgText = hgc.instance().createSVGString();
      const greenIx = svgText.indexOf('green');

      expect(greenIx).to.be.above(0);
      done();
    });

    it('Checks segment polygons', (done) => {
      hgc.instance().state.views.aa.tracks.top[0].options.annotationStyle = 'segment';

      hgc.setState(hgc.instance().state);
      hgc.update();

      const trackObj = getTrackObjectFromHGC(hgc.instance(),
        viewConf.views[0].uid,
        viewConf.views[0].tracks.top[0].uid);

      for (const tileId in trackObj.drawnRects) {
        for (const uid in trackObj.drawnRects[tileId]) {
          const rect = trackObj.drawnRects[tileId][uid];

          // the segment polygons have 12 vertices
          expect(rect[0].length).to.eql(24);
        }
      }

      done();
    });

    afterAll(() => {
      removeHGComponent(div);
    });
  });

  const viewConf = {
    editable: true,
    zoomFixed: false,
    trackSourceServers: [
      'http://higlass.io/api/v1'
    ],
    exportViewUrl: 'http://higlass.io/api/v1/viewconfs/',
    views: [
      {
        uid: 'aa',
        initialXDomain: [
          1585110207.2930722,
          1586490384.5429244
        ],
        initialYDomain: [
          1187975248.2421436,
          1187975248.2421436
        ],
        autocompleteSource: 'http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&',
        genomePositionSearchBoxVisible: false,
        chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
        tracks: {
          top: [
            {
              uid: 'a',
              type: 'bedlike',
              tilesetUid: 'N3g_OsVITeulp6cUs2EaJA',
              server: 'http://higlass.io/api/v1',
              height: 80,
              options: {
                alternating: false,
                fillColor: 'blue',
                axisPositionHorizontal: 'right',
                labelColor: 'black',
                labelPosition: 'hidden',
                labelLeftMargin: 0,
                labelRightMargin: 0,
                labelTopMargin: 0,
                labelBottomMargin: 0,
                minHeight: 20,
                trackBorderWidth: 0,
                trackBorderColor: 'black',
                valueColumn: null,
                colorEncoding: false,
                showTexts: true,
                colorRange: [
                  '#000000',
                  '#652537',
                  '#bf5458',
                  '#fba273',
                  '#ffffe0'
                ],
                colorEncodingRange: false,
                name: 'CTCF motifs (hg19)'
              }
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
        genomePositionSearchBox: {
          autocompleteServer: 'http://higlass.io/api/v1',
          chromInfoServer: 'http://higlass.io/api/v1',
          visible: true,
          chromInfoId: 'hg19',
          autocompleteId: 'OHJakQICQD6gTD7skx4EWA'
        }
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
});
