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


configure({ adapter: new Adapter() });

describe('SVG Export', () => {
  let hgc = null;
  let div = null;

  const viewConf = {
    editable: true,
    zoomFixed: false,
    trackSourceServers: [
      'http://higlass.io/api/v1'
    ],
    views: [
      {
        uid: 'aa',
        initialXDomain: [
          7595655.0000270605,
          2507738795.999973
        ],
        initialYDomain: [
          25120022.810774326,
          2490214428.189226
        ],
        genomePositionSearchBoxVisible: false,
        chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
        tracks: {
          top: [],
          left: [],
          center: [],
          right: [],
          bottom: [],
          whole: [
            {
              type: 'cross-rule',
              x: 1000000000,
              y: 1000000000,
              position: 'whole',
              options: {},
              name: 'Cross Rule',
            },
            {
              type: 'horizontal-rule',
              y: 2000000000,
              position: 'whole',
              options: {},
              name: 'Horizontal Rule',
            },
            {
              type: 'vertical-rule',
              x: 2000000000,
              position: 'whole',
              options: {},
              name: 'Vertical Rule',
            }
          ],
          gallery: []
        },
        layout: {
          w: 12,
          h: 12,
          x: 0,
          y: 0,
          i: 'aa',
          moved: false,
          static: false
        }
      }
    ]
  };

  beforeAll((done) => {
    ([div, hgc] = mountHGComponent(div, hgc, viewConf,
      done));
  });

  it('exports rules', () => {
    const svg = hgc.instance().createSVG();
    expect(svg).to.equal('foo');
  });

  afterAll((done) => {
    removeHGComponent(div);
    done();
  });
});
