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

describe('PNG Export', () => {
  let hgc = null;
  let div = null;

  describe('tests', () => {
    beforeAll((done) => {
      ([div, hgc] = mountHGComponent(div, hgc, 'http://higlass.io/api/v1/viewconfs/?d=Y7FtjugjR6OIV_P2DRqCSg',
        done));
    });

    it('Exports to PNG', (done) => {
      const blobPromise = hgc.instance().createPNGBlobPromise();
      blobPromise.then((blob) => {
        const reader = new FileReader();
        reader.addEventListener('loadend', () => {
          const array = new Uint8Array(reader.result.slice(1, 4));
          const pngString = new TextDecoder('iso-8859-2').decode(array);
          expect(pngString).to.equal('PNG');
          done();
        });
        reader.readAsArrayBuffer(blob);
      });
    });

    afterAll((done) => {
      removeHGComponent(div);
      // document.body.removeChild(div);

      done();
    });
  });
});
