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

Enzyme.configure({ adapter: new Adapter() });

describe('Empty Tracks', () => {
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

    const trackObj1 = getTrackObjectFromHGC(hgc.instance(), 'vv', 't1');
    expect(trackObj1.dimensions[0]).to.eql(73);

    const trackObj2 = getTrackObjectFromHGC(hgc.instance(), 'vv', 't2');
    expect(trackObj2.dimensions[1]).to.eql(42);
  });

  after(() => {
    removeHGComponent(div);
  });
});

// enter either a viewconf link or a viewconf object
const viewconf = {
  editable: true,
  zoomFixed: false,
  trackSourceServers: ['/api/v1', 'http://higlass.io/api/v1'],
  exportViewUrl: '/api/v1/viewconfs/',
  views: [
    {
      uid: 'vv',
      tracks: {
        left: [
          {
            uid: 't1',
            type: 'empty',
            width: 73,
          },
        ],
        top: [
          {
            uid: 't2',
            type: 'empty',
            height: 42,
          },
        ],
      },
    },
  ],
};
