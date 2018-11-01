/* eslint-env node, mocha */
import {
  configure,
  mount,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

// Utils
import {
  mountHGComponent,
  removeHGComponent,
} from '../app/scripts/utils'

import HiGlassComponent from '../app/scripts/HiGlassComponent';

// Utils
import {
  waitForTilesLoaded,
} from '../app/scripts/utils';

// View configs
import {
  testViewConfX1,
} from './view-configs';

configure({ adapter: new Adapter() });

describe('PNG Export', () => {
  let hgc = null;
  let div = null;

  describe('tests', () => {
    beforeAll((done) => {
      ([div, hgc] = mountHGComponent(div, hgc, 'http://higlass.io/api/v1/viewconfs/?d=Y7FtjugjR6OIV_P2DRqCSg',
        done));
    })

    it ("Exports to PNG", (done) => {
      const blobPromise = hgc.instance().createPNGBlobPromise();
      blobPromise.then(function(blob) {
        const reader = new FileReader();
        reader.addEventListener("loadend", function() {
          const array = new Uint8Array(reader.result.slice(1,4));
          const pngString = new TextDecoder("iso-8859-2").decode(array);
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