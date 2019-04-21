/* eslint-env node, jasmine */
import {
  configure,
  mount,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import React from 'react';

import HiGlassComponent from '../app/scripts/HiGlassComponent';

import {
  waitForJsonComplete,
  waitForTilesLoaded,
  waitForTransitionsFinished,
} from '../app/scripts/utils';

import { geneAnnotationsOnly1 } from './view-configs';

configure({ adapter: new Adapter() });

describe('Genome position search box tests', () => {
  let hgc = null;
  let div = null;

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

  it('Cleans up previously created instances and mounts a new component', (done) => {
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
      viewConfig={geneAnnotationsOnly1}
    />, { attachTo: div });

    hgc.update();
    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Searches for cdkn2b-as1', (done) => {
    const firstDomain = hgc.instance().xScales.aa.domain();

    hgc.instance().genomePositionSearchBoxes.aa.onAutocompleteChange({}, 'cdkn2b-as1');
    hgc.update();

    hgc.instance().genomePositionSearchBoxes.aa.buttonClick();
    hgc.update();

    waitForJsonComplete(() => {
      waitForTransitionsFinished(hgc.instance(), () => {
        const secondDomain = hgc.instance().xScales.aa.domain();
        // make sure that we zoomed somwhere

        expect(firstDomain[0]).not.toEqual(secondDomain[0]);
        expect(firstDomain[1]).not.toEqual(secondDomain[1]);
        done();
      });
    });
  });
});
