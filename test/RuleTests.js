/* eslint-env node, jasmine, mocha */
import {
  configure,
  // render,
} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { expect } from 'chai';
// Utils
import {
  getTrackObjectFromHGC
} from '../app/scripts/utils';

import {
  mountHGComponent,
} from './utils/test-helpers';

configure({ adapter: new Adapter() });
describe('Minimal viewconfs', () => {
  describe('Minimal with CrossRule', () => {
    const viewconf = {
      views: [
        {
          uid: 'aa',
          initialXDomain: [0, 200],
          initialYDomain: [0, 200],
          tracks: {
            whole: [
              {
                uid: 'a',
                type: 'cross-rule',
                x: 100,
                y: 100
              }
            ]
          }
        }
      ]
    };
    let hgc = null;
    let div = null;
    beforeAll((done) => {
      [div, hgc] = mountHGComponent(div, hgc, viewconf, done);
    });

    it('can load and unload', () => {
      expect(true).to.equal(true);
    });

    it('has a position', () => {
      const obj = getTrackObjectFromHGC(hgc.instance(), 'aa', 'a');

      expect(obj.xPosition).to.eql(100);
      expect(obj.yPosition).to.eql(100);
    });

    afterAll(() => {
      // removeHGComponent(div);
    });
  });
});
