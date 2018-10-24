/* eslint-env node, mocha */
import {
  configure,
  // render,
} from 'enzyme';

import {
  select
} from 'd3-selection';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

// Utils
import {
  mountHGComponent,
  getTrackObjectFromHGC,
  waitForTransitionsFinished,
  waitForTilesLoaded,
} from '../app/scripts/utils';

const viewconf =
{
  "editable": true,
  "zoomFixed": false,
  "trackSourceServers": [
    "//higlass.io/api/v1"
  ],
  "exportViewUrl": "/api/v1/viewconfs",
  "views": [
    {
      "uid": "aa",
      "initialXDomain": [
        0,
        3100000000
      ],
      "autocompleteSource": "/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "genomePositionSearchBox": {
        "autocompleteServer": "//higlass.io/api/v1",
        "autocompleteId": "OHJakQICQD6gTD7skx4EWA",
        "chromInfoServer": "//higlass.io/api/v1",
        "chromInfoId": "hg19",
        "visible": true
      },
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "tracks": {
        "top": [],
        "left": [],
        "center": [
          {
            "uid": "CMmXK9fHQcurYScycQiPzg",
            "type": "combined",
            "contents": [
              {
                "name": "Dekker Lab HFFc6 DpnII",
                "created": "2018-04-24T14:27:13.612205Z",
                "server": "//higlass.io/api/v1",
                "tilesetUid": "D_8CofpyQoCqDqeA-A6A4g",
                "uid": "ClsfCEQ4Sdydcw57wkgwBw",
                "type": "heatmap",
                "options": {
                  "backgroundColor": "#eeeeee",
                  "labelPosition": "bottomRight",
                  "colorRange": [
                    "white",
                    "rgba(245,166,35,1.0)",
                    "rgba(208,2,27,1.0)",
                    "black"
                  ],
                  "maxZoom": null,
                  "colorbarPosition": "topRight",
                  "trackBorderWidth": 0,
                  "trackBorderColor": "black",
                  "heatmapValueScaling": "log",
                  "showMousePosition": false,
                  "mousePositionColor": "#999999",
                  "showTooltip": false,
                  "name": "Dekker Lab HFFc6 DpnII",
                  "scaleStartPercent": "0.00000",
                  "scaleEndPercent": "1.00000"
                },
                "width": 100,
                "height": 100,
                "transforms": [
                  {
                    "name": "KR",
                    "value": "KR"
                  },
                  {
                    "name": "ICE",
                    "value": "weight"
                  },
                  {
                    "name": "VC",
                    "value": "VC"
                  },
                  {
                    "name": "VC_SQRT",
                    "value": "VC_SQRT"
                  }
                ],
                "resolutions": [
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
                "position": "center"
              }
            ],
            "position": "center"
          }
        ],
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
      "initialYDomain": [
        821367521.3675213,
        2278632478.6324787
      ]
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



configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let hgc = null;
  let div = null;

  describe('Tiled Pixi Track Tests', () => {
    beforeAll((done) => {
      ([div, hgc] = mountHGComponent(div, hgc,
        viewconf,
        done,
        {
          style: 'width:800px; height:800px; background-color: lightgreen',
          bounded: true,
        })
      );
    });

    it("Ensure we can set a dataChanged listener", (done) => {
      const trackObject = getTrackObjectFromHGC(
        hgc.instance(), 'ClsfCEQ4Sdydcw57wkgwBw'
      );


      const dataChangedCb = (data) => {
        console.log('data', data);
      };

      trackObject.on('dataChanged', dataChangedCb);

      hgc.instance().zoomTo('aa',
        100000000,
        200000000,
        100000000,
        200000000,
        1000);

      waitForTransitionsFinished(hgc.instance(), () => {
        waitForTilesLoaded(hgc.instance(), () => {
          trackObject.off('dataChanged', dataChangedCb);
          done();
        });
      });
      // console.log('trackObject:', trackObject);
      // done();
    });

    afterAll((done) => {
      // document.body.removeChild(div);

      done();
    });
  });
});
