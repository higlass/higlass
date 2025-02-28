// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';

describe('PNG Export', () => {
  let api;
  let div;

  describe('tests', () => {
    beforeEach(async () => {
      const response = await fetch(
        'http://higlass.io/api/v1/viewconfs/?d=Y7FtjugjR6OIV_P2DRqCSg',
      );
      [div, api] = createElementAndApi(await response.json());
    });

    afterEach(() => {
      api.destroy();
      removeDiv(div);
      api = undefined;
      div = undefined;
    });

    it('Exports to PNG', async () => {
      await new Promise((done) => {
        api
          .getComponent()
          .createPNGBlobPromise()
          .then((blob) => {
            const reader = new FileReader();
            reader.addEventListener('loadend', () => {
              const array = new Uint8Array(reader.result.slice(1, 4));
              const pngString = new TextDecoder('iso-8859-2').decode(array);
              expect(pngString).to.equal('PNG');
              done(null);
            });
            reader.readAsArrayBuffer(blob);
          });
      });
    });
  });
});
