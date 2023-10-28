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
import { getTrackObjectFromHGC, getTrackRenderer } from '../app/scripts/utils';

Enzyme.configure({ adapter: new Adapter() });

describe('Chromosome labels', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, viewconf, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  it('should have two ticks for end positions', () => {
    // add your tests here

    const trackObj = getTrackObjectFromHGC(hgc.instance(), 'v1', 't1');
    const trackRenderer = getTrackRenderer(hgc.instance(), 'v1');

    expect(trackRenderer.trackDefObjects.t1.trackDef.track).to.have.property(
      'position',
    );

    expect(trackObj.tickTexts).not.to.have.property('chr17');
    expect(trackObj.tickTexts.all.length).to.eql(2);
  });

  it('should have more than two ticks for other positions', () => {
    hgc.instance().state.views.v1.tracks.top[0].options.tickPositions = 'even';
    hgc.setState(hgc.instance().state);
    hgc.update();

    const trackObj = getTrackObjectFromHGC(hgc.instance(), 'v1', 't1');
    expect(trackObj.tickTexts).to.have.property('chr17');
  });

  after(() => {
    removeHGComponent(div);
  });
});

// enter either a viewconf link or a viewconf object
const viewconf = {
  zoomFixed: false,
  views: [
    {
      layout: {
        w: 6,
        h: 2,
        x: 0,
        y: 0,
      },
      uid: 'v1',
      initialYDomain: [2541211477.406149, 2541211477.406149],
      initialXDomain: [2530833240.1518626, 2548865408.153668],
      tracks: {
        left: [],
        top: [
          {
            server: 'http://higlass.io/api/v1',
            tilesetUid: 'N12wVGG9SPiTkk03yUayUw',
            uid: 't1',
            type: 'horizontal-chromosome-labels',
            options: {
              color: '#808080',
              stroke: '#ffffff',
              fontSize: 12,
              fontIsLeftAligned: false,
              showMousePosition: true,
              mousePositionColor: '#000000',
              tickPositions: 'ends',
            },
            width: 20,
            height: 30,
          },
        ],
        right: [],
        center: [],
        bottom: [],
        whole: [],
        gallery: [],
      },
      chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
      genomePositionSearchBox: {
        visible: true,
        chromInfoServer: 'http://higlass.io/api/v1',
        chromInfoId: 'hg19',
        autocompleteServer: 'http://higlass.io/api/v1',
        autocompleteId: 'OHJakQICQD6gTD7skx4EWA',
      },
    },
  ],
  editable: true,
  viewEditable: true,
  tracksEditable: true,
  exportViewUrl: '/api/v1/viewconfs',
  trackSourceServers: ['http://higlass.io/api/v1'],
};
