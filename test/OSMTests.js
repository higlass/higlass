// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

// Utils
import { removeHGComponent } from '../app/scripts/test-helpers';

import { osmConf } from './view-configs';

import { viewer } from '../app/scripts/hglib';

Enzyme.configure({ adapter: new Adapter() });

function createElementAndAPI(viewConfig, options) {
  const div = global.document.createElement('div');
  global.document.body.appendChild(div);

  div.setAttribute(
    'style',
    'width:600px; height: 400px; background-color: lightgreen',
  );

  const api = viewer(div, viewConfig, options);

  return [div, api];
}

describe('OSM tests', () => {
  it('creates an editable component', () => {
    const track = osmConf.views[0].tracks.center[0];
    track.options.minPos = -180;
    track.options.maxPos = 180;

    osmConf.views[0].initialXDomain = [-71.2, -69.8];
    osmConf.views[0].initialYDomain = [-42.4, -42.3];
    osmConf.views[0].layout.w = 12;

    const [div, api] = createElementAndAPI(osmConf, {
      bounded: true,
    });

    const component = api.getComponent();
    expect(Object.keys(component.viewHeaders).length).to.be.above(0);

    removeHGComponent(div);
  });

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

  // });
});
