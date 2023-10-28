// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

// Utils
import {
  mountHGComponent,
  removeHGComponent,
} from '../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../app/scripts/utils';

const viewconf = {
  editable: true,
  zoomFixed: false,
  trackSourceServers: ['/api/v1', 'http://higlass.io/api/v1'],
  exportViewUrl: '/api/v1/viewconfs/',
  views: [
    {
      tracks: {
        top: [],
        left: [],
        center: [
          {
            uid: 'CGcgQhpGT3ml7C3ktqIsng',
            type: 'combined',
            contents: [
              {
                name: 'Chromosome Grid',
                created: '2018-09-19T14:10:50.358616Z',
                server: 'http://higlass.io/api/v1',
                tilesetUid: 'f2FZsbCBTbyIx7A-xiRq5Q',
                uid: 'Mw2aWH9TTcu38t5OZlCYyA',
                type: '2d-chromosome-grid',
                options: {
                  lineStrokeWidth: 1,
                  lineStrokeColor: 'grey',
                },
                width: 819,
                height: 860,
                position: 'center',
              },
            ],
            position: 'center',
            options: {},
            width: 819,
            height: 860,
          },
        ],
        right: [],
        bottom: [],
        whole: [],
        gallery: [],
      },
      initialXDomain: [77515298.79442959, 145520235.32544723],
      initialYDomain: [34065918.61085448, 102548641.5812001],
      layout: {
        w: 6,
        h: 12,
        x: 0,
        y: 0,
        i: 'CU_JcrfjS1WAtkA_B_FgJA',
        moved: false,
        static: false,
      },
      uid: 'CU_JcrfjS1WAtkA_B_FgJA',
      genomePositionSearchBoxVisible: false,
      genomePositionSearchBox: {
        autocompleteServer: 'http://higlass.io/api/v1',
        chromInfoServer: 'http://higlass.io/api/v1',
        visible: false,
        chromInfoId: 'dm6',
        autocompleteId: 'B2skqtzdSLyWYPTYM8t8lQ',
      },
    },
  ],
  zoomLocks: {
    locksByViewUid: {
      CU_JcrfjS1WAtkA_B_FgJA: 'cikAbtE_QheykUpRuK7Qjw',
    },
    locksDict: {
      cikAbtE_QheykUpRuK7Qjw: {
        CU_JcrfjS1WAtkA_B_FgJA: [
          71863001.5, 66266238.499999985, 192920.8093959731,
        ],
        uid: 'cikAbtE_QheykUpRuK7Qjw',
      },
    },
  },
  locationLocks: {
    locksByViewUid: {
      Kn74dL2xQa2elKAarSlKkA: 'YNR09QkUTxyg3ehvn1geig',
      CU_JcrfjS1WAtkA_B_FgJA: 'YNR09QkUTxyg3ehvn1geig',
      NhBtMCycT6qeCTNnBoVGKw: 'YNR09QkUTxyg3ehvn1geig',
      O54DSbN8QX65l_PvR84SEg: 'YNR09QkUTxyg3ehvn1geig',
    },
    locksDict: {
      YNR09QkUTxyg3ehvn1geig: {
        O54DSbN8QX65l_PvR84SEg: [
          71863001.50000001, 66266238.499999985, 192920.80939597404,
        ],
        NhBtMCycT6qeCTNnBoVGKw: [
          71863001.5, 66266238.499999985, 192920.80939597404,
        ],
        Kn74dL2xQa2elKAarSlKkA: [
          71863001.50000001, 66266238.499999985, 192920.80939597404,
        ],
        CU_JcrfjS1WAtkA_B_FgJA: [
          71863001.5, 66266238.499999985, 192920.8093959731,
        ],
        uid: 'YNR09QkUTxyg3ehvn1geig',
      },
    },
  },
  valueScaleLocks: {
    locksByViewUid: {
      'Kn74dL2xQa2elKAarSlKkA.fTlyU4HFQguzeZBD8tOS0Q': 'MCw1A5zMQ3yLAZTzOpv7iw',
      'NhBtMCycT6qeCTNnBoVGKw.HsvvujjIRj-iO4qBFeYHBg': 'MCw1A5zMQ3yLAZTzOpv7iw',
      'O54DSbN8QX65l_PvR84SEg.VqGNUFXvTpm80KNX2CZ7Ew': 'MCw1A5zMQ3yLAZTzOpv7iw',
    },
    locksDict: {
      MCw1A5zMQ3yLAZTzOpv7iw: {
        'O54DSbN8QX65l_PvR84SEg.VqGNUFXvTpm80KNX2CZ7Ew': {
          view: 'O54DSbN8QX65l_PvR84SEg',
          track: 'VqGNUFXvTpm80KNX2CZ7Ew',
        },
        'NhBtMCycT6qeCTNnBoVGKw.HsvvujjIRj-iO4qBFeYHBg': {
          view: 'NhBtMCycT6qeCTNnBoVGKw',
          track: 'HsvvujjIRj-iO4qBFeYHBg',
        },
        'Kn74dL2xQa2elKAarSlKkA.fTlyU4HFQguzeZBD8tOS0Q': {
          view: 'Kn74dL2xQa2elKAarSlKkA',
          track: 'fTlyU4HFQguzeZBD8tOS0Q',
        },
        uid: 'MCw1A5zMQ3yLAZTzOpv7iw',
      },
    },
  },
};

Enzyme.configure({ adapter: new Adapter() });

describe('Chromsizes tests', () => {
  let hgc = null;
  let div = null;

  describe('Chromosome Grid Tests', () => {
    before((done) => {
      [div, hgc] = mountHGComponent(div, hgc, viewconf, done, {
        style: 'width:800px; height:800px; background-color: lightgreen',
        bounded: true,
      });
    });

    it("Ensure that the viewport projection's borders are grey", () => {
      const trackObject = getTrackObjectFromHGC(
        hgc.instance(),
        'Mw2aWH9TTcu38t5OZlCYyA',
      );

      expect(trackObject.options.lineStrokeColor).to.eql('grey');
    });

    after(() => {
      removeHGComponent(div);
    });
  });
});
