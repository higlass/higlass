/* eslint-env node, jasmine, mocha */
import {
  configure,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

// Utils
import {
  mountHGComponent,
  removeHGComponent,
} from '../app/scripts/utils';

/* eslint-disable */
const viewConf = {
  "views": [
    {
      "tracks": {
        "center": [
          {
            "type": "combined",
            "contents": [
              {
                "server": "//higlass.io/api/v1",
                "tilesetUid": "CQMd6V_cRw6iCI_-Unl3PQ",
                "type": "heatmap",
                "options": {
                  "colorRange": [
                    "white",
                    "black"
                  ],
                  "heatmapValueScaling": "log",
                  "scaleStartPercent": "0.00000",
                  "scaleEndPercent": "1.00000"
                }
              },
            ]
          }
        ]
      }
    }
  ]
};

configure({ adapter: new Adapter() });

describe('PNG Export', () => {
  let hgc = null;
  let div = null;

  describe('tests', () => {
    beforeAll((done) => {
      ([div, hgc] = mountHGComponent(div, hgc, viewConf,
        done));
    });

    it('Exports to SVG', () => {
      const svg = hgc.instance().createSVG();
      const colorBar = svg.getElementsByClassName('color-bar')[0];
      const rects = colorBar.getElementsByTagName('rect');
      
      const colorBarText = new XMLSerializer().serializeToString(colorBar);
      // If the logic changed, and rgb(0, 0, 0) was included,
      // that would be ok, but it should be intentional.
      expect(colorBarText).not.to.contain('rgb(0, 0, 0)');
      expect(colorBarText).to.contain('rgb(1, 1, 1)');
      expect(colorBarText).to.contain('rgb(255, 255, 255)');
    });

    afterAll(() => {
      removeHGComponent(div);
    });
  });
});
