/* eslint-env node, jasmine */
import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';
import FetchMockHelper from './utils/FetchMockHelper';

import viewConf from './view-configs/pngexport';

describe('PNG Export', () => {
  let api;
  let div;
  const fetchMockHelper = new FetchMockHelper(viewConf, 'PngExportTest');

  beforeAll(async () => {
    await fetchMockHelper.activateFetchMock();
  });

  describe('tests', () => {
    beforeEach(() => {
      [div, api] = createElementAndApi(viewConf);
    });

    it('Exports to PNG', done => {
      const blobPromise = api.getComponent().createPNGBlobPromise();
      blobPromise.then(blob => {
        const reader = new FileReader();
        reader.addEventListener('loadend', () => {
          const array = new Uint8Array(reader.result.slice(1, 4));
          const pngString = new TextDecoder('iso-8859-2').decode(array);
          expect(pngString).toEqual('PNG');
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

  afterAll(async () => {
    await fetchMockHelper.storeDataAndResetFetchMock();
  });
});
