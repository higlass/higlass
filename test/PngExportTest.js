// @ts-nocheck
/* eslint-env mocha */
import { expect } from 'chai';
import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';

describe('PNG Export', () => {
  let api;
  let div;

  describe('tests', () => {
    beforeEach(() => {
      [div, api] = createElementAndApi(
        'http://higlass.io/api/v1/viewconfs/?d=Y7FtjugjR6OIV_P2DRqCSg',
      );
    });

    it('Exports to PNG', (done) => {
      const blobPromise = api.getComponent().createPNGBlobPromise();
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

    afterEach(() => {
      api.destroy();
      removeDiv(div);
      api = undefined;
      div = undefined;
    });
  });
});
