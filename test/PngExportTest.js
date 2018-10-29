/* eslint-env node, mocha */
import {
  configure,
  mount,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

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
  
  beforeEach((done) => {
    if (hgc) {
      hgc.unmount();
      hgc.detach();
    }

    if (div) {
      global.document.body.removeChild(div);
    }

    div = global.document.createElement('div');
    global.document.body.appendChild(div);

    div.setAttribute('style', 'width:800px;background-color: lightgreen');
    div.setAttribute('id', 'simple-hg-component');

    hgc = mount(<HiGlassComponent
      options={{ bounded: false }}
      viewConfig={testViewConfX1}
    />, { attachTo: div });

    hgc.update();
    waitForTilesLoaded(hgc.instance(), done);
  });

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
});