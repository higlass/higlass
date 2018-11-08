/* eslint-env node, mocha */
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

    it('Ensures that the track was rendered', (done) => {
      expect(hgc.instance().state.viewConfig.editable).to.eql(true);
      const trackObj = getTrackObjectFromHGC(hgc.instance(),
        viewConf.views[0].uid,
        viewConf.views[0].tracks.top[0].uid);

      expect(Object.keys(trackObj.drawnRects).length).to.be.above(0);
      done();
    });

    afterAll((done) => {
      removeHGComponent(div);
      done();
    });
  });
});

const viewConf = {
  "editable": true,
  "zoomFixed": false,
  "trackSourceServers": [
    "http://higlass.io/api/v1"
  ],
  "exportViewUrl": "http://higlass.io/api/v1/viewconfs/",
  "views": [
    {
      "uid": "aa",
      "initialXDomain": [
        -252359004.01034582,
        2768731225.3911114
      ],
      "initialYDomain": [
        -81794317.90460095,
        2599238446.8497105
      ],
      "autocompleteSource": "http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "genomePositionSearchBoxVisible": false,
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "tracks": {
        "top": [{
          "uid": 'a',
          "type": "bedlike",
          "tilesetUid": "N3g_OsVITeulp6cUs2EaJA",
          "server": "http://higlass.io/api/v1"
        }],
        "left": [],
        "center": [],
        "right": [],
        "bottom": [],
        "whole": [],
        "gallery": []
      },
      "layout": {
        "w": 12,
        "h": 12,
        "x": 0,
        "y": 0,
        "i": "aa",
        "moved": false,
        "static": false
      },
      "genomePositionSearchBox": {
        "autocompleteServer": "http://higlass.io/api/v1",
        "chromInfoServer": "http://higlass.io/api/v1",
        "visible": true,
        "chromInfoId": "hg19",
        "autocompleteId": "OHJakQICQD6gTD7skx4EWA"
      }
    }
  ],
  "zoomLocks": {
    "locksByViewUid": {},
    "locksDict": {}
  },
  "locationLocks": {
    "locksByViewUid": {},
    "locksDict": {}
  },
  "valueScaleLocks": {
    "locksByViewUid": {},
    "locksDict": {}
  }
}
