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

const baseConf = {
  views: [
    {
      tracks: {
        center: [
          {
            type: 'combined',
            contents: [
              {
                server: '//higlass.io/api/v1',
                tilesetUid: 'CQMd6V_cRw6iCI_-Unl3PQ',
                type: 'heatmap',
                options: {
                  colorRange: [
                    'white',
                    'black'
                  ]
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

describe('SVG Export', () => {
  describe('color bars 0-1 log', () => {
    let hgc = null;
    let div = null;
    beforeAll((done) => {
      const viewConf = JSON.parse(JSON.stringify(baseConf));
      const options = viewConf.views[0].tracks.center[0].contents[0].options;
      options.scaleStartPercent = 0;
      options.scaleEndPercent = 1;
      options.heatmapValueScaling = 'log';
      ([div, hgc] = mountHGComponent(div, hgc, viewConf,
        done,
        {
          style: 'width:800px; height:800px; background-color: lightgreen',
          bounded: true,
        })
      );
    });

    it('scales correctly', () => {
      const svg = hgc.instance().createSVG();
      const colorBar = svg.getElementsByClassName('color-bar')[0];
      const rects = colorBar.getElementsByTagName('rect');
      expect(rects.length).to.equal(257);
      expect(rects[1].getAttribute('style')).to.equal('fill: rgb(1, 1, 1)');
      expect(rects[127].getAttribute('style')).to.equal('fill: rgb(127, 127, 127)');
      expect(rects[255].getAttribute('style')).to.equal('fill: rgb(255, 255, 255)');
    });

    afterAll(() => {
      removeHGComponent(div);
    });
  });

  describe('color bars 0.5-1 log', () => {
    let hgc = null;
    let div = null;
    beforeAll((done) => {
      const viewConf = JSON.parse(JSON.stringify(baseConf));
      const options = viewConf.views[0].tracks.center[0].contents[0].options;
      options.scaleStartPercent = 0.5;
      options.scaleEndPercent = 1;
      options.heatmapValueScaling = 'log';
      ([div, hgc] = mountHGComponent(div, hgc, viewConf,
        done));
    });

    it('scales correctly', () => {
      const svg = hgc.instance().createSVG();
      const colorBar = svg.getElementsByClassName('color-bar')[0];
      const rects = colorBar.getElementsByTagName('rect');
      expect(rects.length).to.equal(257);
      expect(rects[1].getAttribute('style')).to.equal('fill: rgb(1, 1, 1)');
      expect(rects[127].getAttribute('style')).to.equal('fill: rgb(255, 255, 255)');
      expect(rects[255].getAttribute('style')).to.equal('fill: rgb(255, 255, 255)');
    });

    afterAll(() => {
      removeHGComponent(div);
    });
  });
});
