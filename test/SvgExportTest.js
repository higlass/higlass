// @ts-nocheck
/* eslint-env mocha */
import { configure } from 'enzyme';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

import { expect } from 'chai';

// Utils
import {
  mountHGComponent,
  removeHGComponent,
} from '../app/scripts/test-helpers';

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
                  colorRange: ['white', 'black'],
                },
              },
            ],
          },
        ],
      },
    },
  ],
};

configure({ adapter: new Adapter() });

describe('SVG Export', () => {
  describe('color bars 0-1 log', () => {
    let hgc = null;
    let div = null;
    before((done) => {
      const viewConf = JSON.parse(JSON.stringify(baseConf));
      const options = viewConf.views[0].tracks.center[0].contents[0].options;
      options.scaleStartPercent = 0;
      options.scaleEndPercent = 1;
      options.heatmapValueScaling = 'log';
      [div, hgc] = mountHGComponent(div, hgc, viewConf, done);
    });

    it('scales correctly', () => {
      const svg = hgc.instance().createSVG();
      const colorBar = svg.getElementsByClassName('color-bar')[0];
      const rects = colorBar.getElementsByTagName('rect');
      expect(rects.length).to.equal(257);
      expect(rects[1].getAttribute('style')).to.equal('fill: rgb(1, 1, 1)');
      expect(rects[127].getAttribute('style')).to.equal(
        'fill: rgb(127, 127, 127)',
      );
      expect(rects[255].getAttribute('style')).to.equal(
        'fill: rgb(255, 255, 255)',
      );
    });

    after(() => {
      removeHGComponent(div);
    });
  });

  describe('color bars 0.5-1 log', () => {
    let hgc = null;
    let div = null;
    before((done) => {
      const viewConf = JSON.parse(JSON.stringify(baseConf));
      const options = viewConf.views[0].tracks.center[0].contents[0].options;
      options.scaleStartPercent = 0.5;
      options.scaleEndPercent = 1;
      options.heatmapValueScaling = 'log';
      [div, hgc] = mountHGComponent(div, hgc, viewConf, done);
    });

    it('scales correctly', () => {
      const svg = hgc.instance().createSVG();
      const colorBar = svg.getElementsByClassName('color-bar')[0];
      const rects = colorBar.getElementsByTagName('rect');
      expect(rects.length).to.equal(257);
      expect(rects[1].getAttribute('style')).to.equal('fill: rgb(1, 1, 1)');
      expect(rects[127].getAttribute('style')).to.equal(
        'fill: rgb(255, 255, 255)',
      );
      expect(rects[255].getAttribute('style')).to.equal(
        'fill: rgb(255, 255, 255)',
      );
    });

    after(() => {
      removeHGComponent(div);
    });
  });

  describe('horizontal, vertical, and cross rules', () => {
    let hgc = null;
    let div = null;

    const addedRulesConf = {
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
                      colorRange: ['white', 'black'],
                    },
                  },
                ],
              },
            ],
            whole: [
              {
                type: 'vertical-rule',
                x: 2544051862.4804587,
                options: {},
                uid: 'LoWaxFMuRAmSLFJzhiYmKQ',
                width: 20,
                height: 20,
              },
              {
                type: 'horizontal-rule',
                y: 2537291938.292442,
                options: {},
                uid: 'V0qsdww3SO2pIHUhIWZaSQ',
                width: 20,
                height: 20,
              },
              {
                type: 'cross-rule',
                x: 2543805011.140535,
                y: 2536118340.322387,
                options: {},
                uid: 'dw5LQpd9Srm2uxBsfpCv0g',
                width: 20,
                height: 20,
              },
            ],
          },
        },
      ],
    };

    before((done) => {
      const viewConf = JSON.parse(JSON.stringify(addedRulesConf));
      const options = viewConf.views[0].tracks.center[0].contents[0].options;
      options.scaleStartPercent = 0;
      options.scaleEndPercent = 1;
      options.heatmapValueScaling = 'log';
      [div, hgc] = mountHGComponent(div, hgc, viewConf, done);
    });

    it('includes line for added vertical rule', () => {
      const svg = hgc.instance().createSVG();
      const group = svg.getElementsByClassName('vertical-rule')[0];
      const line = group.getElementsByTagName('line');
      expect(line.length).to.equal(1);
      expect(Number(line[0].getAttribute('y1'))).to.equal(0);
      expect(Number(line[0].getAttribute('y2'))).to.be.greaterThan(0);
      expect(Number(line[0].getAttribute('x1'))).to.equal(649.2246915865658);
    });

    it('includes line for added horizontal rule', () => {
      const svg = hgc.instance().createSVG();
      const group = svg.getElementsByClassName('horizontal-rule')[0];
      const line = group.getElementsByTagName('line');
      expect(line.length).to.equal(1);
      expect(Number(line[0].getAttribute('x1'))).to.equal(0);
      expect(Number(line[0].getAttribute('x2'))).to.be.greaterThan(0);
      expect(Number(line[0].getAttribute('y1'))).to.equal(307.4996050186234);
    });

    it('includes lines for added cross rule', () => {
      const svg = hgc.instance().createSVG();
      const group = svg.getElementsByClassName('cross-rule')[0];
      const line = group.getElementsByTagName('line');
      expect(line.length).to.equal(2);
      expect(Number(line[0].getAttribute('y1'))).to.equal(0);
      expect(Number(line[0].getAttribute('y2'))).to.be.greaterThan(0);
      expect(Number(line[0].getAttribute('x1'))).to.equal(649.1616968074917);
      expect(Number(line[1].getAttribute('x1'))).to.equal(0);
      expect(Number(line[1].getAttribute('x2'))).to.be.greaterThan(0);
      expect(Number(line[1].getAttribute('y1'))).to.equal(307.2001108175058);
    });

    after(() => {
      removeHGComponent(div);
    });
  });
});
