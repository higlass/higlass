/* eslint-env node, mocha */
import {
  configure,
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

import {
  simpleCenterViewConfig,
} from './view-configs';

import {
  viewer
} from '../app/scripts/hglib';

configure({ adapter: new Adapter() });

function createElementAndAPI(viewConfig, options) {
  const div = global.document.createElement('div');
  global.document.body.appendChild(div);

  div.setAttribute('style', 'width:600px; height: 400px; background-color: lightgreen');

  const api = viewer(div, viewConfig, options);

  return [div, api];
}

describe('Simple HiGlassComponent', () => {
  describe('Options tests', () => {
    it('creates an editable component', () => {
      const [div, api] = createElementAndAPI(simpleCenterViewConfig);

      const component = api.getComponent();

      // console.log('viewHeaders:', component.viewHeaders);
      expect(Object.keys(component.viewHeaders).length).to.be.above(0);

      document.body.removeChild(div);
    });

    it('creates a non editable component', () => {
      const [div, api] = createElementAndAPI(simpleCenterViewConfig,
        { editable: false });

      const component = api.getComponent();

      // console.log('viewHeaders:', component.viewHeaders);
      expect(Object.keys(component.viewHeaders).length).to.eql(0);
      document.body.removeChild(div);
    });

    return;
    
    // it('creates a new component with different options and checks'
    //   + 'whether the global options object of the first object has changed', () => {
    //   // create one div and set an auth header
    //   const div = global.document.createElement('div');
    //   global.document.body.appendChild(div);

    //   const api = viewer(div, simpleCenterViewConfig, { a: 'x' });

    //   api.setViewConfig(simpleCenterViewConfig);
    //   api.setAuthHeader('blah');

    //   // create a second component and set a different auth header
    //   const div1 = global.document.createElement('div');
    //   global.document.body.appendChild(div1);

    //   const api1 = viewer(div1, simpleCenterViewConfig, { a: 'y' });
    //   api1.setAuthHeader('wha');

    //   // check to make sure that the two components have different
    //   // auth headers

    //   document.body.removeChild(div);
    //   document.body.removeChild(div1);
    // });
  });
});
