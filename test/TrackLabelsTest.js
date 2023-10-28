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

Enzyme.configure({ adapter: new Adapter() });

describe('Track Labels Test', () => {
  describe('Minimal with CrossRule', () => {
    const viewconf = {
      editable: true,
      views: [
        {
          uid: 'aa',
          tracks: {
            top: [
              {
                name: 'wgEncodeLicrHistoneLiverH3k04me3UE14halfC57bl6StdSig.hitile',
                created: '2017-11-02T15:37:26.351612Z',
                project: null,
                project_name: '',
                description: '',
                server: '//higlass.io/api/v1',
                tilesetUid: 'Hj6L9JuNRnC1004qQqV_LQ',
                uid: 'a',
                type: 'horizontal-bar',
                options: {
                  barFillColor: 'red',
                },
                width: 1109,
                height: 106,
                position: 'top',
              },
            ],
          },
        },
      ],
    };
    let hgc = null;
    let div = null;
    before((done) => {
      [div, hgc] = mountHGComponent(div, hgc, viewconf, done);
    });

    it('sets the label to the color of the bars', () => {
      const obj = hgc.instance().getTrackObject('aa', 'a');

      expect(obj.labelText._style._fill).to.eql('#ff0000');
    });

    after(() => {
      removeHGComponent(div);
    });
  });
});
