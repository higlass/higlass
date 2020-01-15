/* eslint-env node, jasmine, mocha */
import {
  configure
  // render,
} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { expect } from 'chai';
// Utils
import {
  mountHGComponent,
  // removeHGComponent,
  getTrackObjectFromHGC
} from '../app/scripts/utils';

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
            left: [{ type: 'left-axis', width: 20 }],
            whole: [
              {
                uid: 'a',
                type: 'cross-rule',
                x: 100,
                y: 100
              },
              {
                uid: 'b',
                type: 'vertical-rule',
                x: 110
              }
            ]
          }
        }
      ]
    };
    let hgc = null;
    let div = null;
    beforeAll(done => {
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

    it('has the same range if a new track is added', () => {
      const obj1 = getTrackObjectFromHGC(hgc.instance(), 'aa', 'b');
      const obj1Width = obj1._xScale.range()[1];

      hgc.instance().handleTrackAdded(
        'aa',
        {
          uid: 'c',
          type: 'vertical-rule',
          x: 120
        },
        'whole'
      );

      hgc.setState(hgc.instance().state);
      hgc.update();

      const obj2 = getTrackObjectFromHGC(hgc.instance(), 'aa', 'c');
      const obj2Width = obj2._xScale.range()[1];

      // "whole" tracks have different scale ranges that have to be
      // properly set in TrackRenderer. There was a bug where loading
      // a viewconf with pre-configured rules didn't properly set the
      // range and led to the rules moving about
      expect(obj1Width).to.equal(obj2Width);
    });

    afterAll(() => {
      // removeHGComponent(div);
    });
  });
});
