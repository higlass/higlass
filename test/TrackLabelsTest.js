/* eslint-env node, jasmine, mocha */
import {
  configure,
  // render,
} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { expect } from 'chai';
// Utils
import {
  mountHGComponent,
  // removeHGComponent,
  getTrackObjectFromHGC,
} from '../app/scripts/utils';

configure({ adapter: new Adapter() });
describe('Minimal viewconfs', () => {
  describe('Minimal with CrossRule', () => {
    const viewconf = {
      views: [
        {
          uid: 'aa',
          tracks: {
            top: [
              {
                "name": "wgEncodeLicrHistoneLiverH3k04me3UE14halfC57bl6StdSig.hitile",
                "created": "2017-11-02T15:37:26.351612Z",
                "project": null,
                "project_name": "",
                "description": "",
                "server": "//higlass.io/api/v1",
                "tilesetUid": "Hj6L9JuNRnC1004qQqV_LQ",
                "uid": "cmjlHgD5RG---0Ke8dJI7g",
                "type": "horizontal-bar",
                "options": {
                  "barFillColor": "brown"
                },
                "width": 1109,
                "height": 106,
                "position": "top"
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
