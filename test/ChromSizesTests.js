/* eslint-env node, mocha */
import {
  configure,
  // render,
} from 'enzyme';

import {
  select
} from 'd3-selection';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

// Utils
import {
  mountHGComponent,
} from '../app/scripts/utils';


configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let hgc = null;
  let div = null;

  describe('Viewport projection tests', () => {
    // beforeAll((done) => {
    //   ([div, hgc] = mountHGComponent(div, hgc,
    //     'http://higlass.io/api/v1/viewconfs/?d=bY1ZLn6-Sr6WdXQE2abaiA',
    //     done,
    //     {
    //       style: 'width:1200px; height:1500px; background-color: lightgreen',
    //       bounded: true,
    //     })
    //   );
    // });

    // it("Ensure that the viewport projection's borders are black", (done) => {
    //   done();
    // });

    // afterAll((done) => {
    //   // document.body.removeChild(div);

    //   done();
    // });
  });
});
