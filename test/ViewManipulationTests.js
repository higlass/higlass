/* eslint-env node, jasmine, mocha */
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
  removeHGComponent,
  waitForTilesLoaded,
} from '../app/scripts/utils';

configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let hgc = null;
  let div = null;

  describe('Viewport projection tests', () => {
    beforeAll((done) => {
      ([div, hgc] = mountHGComponent(div, hgc,
        'http://higlass.io/api/v1/viewconfs/?d=KaeBVQQpTaqT0kfhE32boQ',
        done,
        {
          style: 'width:800px; height:400px; background-color: lightgreen',
          bounded: true,
        })
      );
    });

    it("Ensure that the viewport projection's borders are black", (done) => {
      hgc.instance().handleAddView(
        Object.values(hgc.instance().state.views)[0]
      );

      waitForTilesLoaded(hgc.instance(), () => {
        const views = Object.values(hgc.instance().state.views);

        // make sure the width of the view has been halved
        expect(views[0].layout.w).to.eql(6);
        expect(views[1].layout.w).to.eql(6);

        done();
      });
    });

    afterAll((done) => {
      removeHGComponent(div);
      
      done();
    });
  });
});
