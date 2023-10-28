// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import React from 'react';

import HiGlassComponent from '../app/scripts/HiGlassComponent';

import {
  waitForJsonComplete,
  waitForTilesLoaded,
  waitForTransitionsFinished,
} from '../app/scripts/test-helpers';

import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';

import { geneAnnotationsOnly1, noGPSB } from './view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Genome position search box tests', () => {
  let hgc = null;
  let div = null;

  describe('Default chromsizes', () => {
    let api = null;

    it('are loaded and displayed', (done) => {
      const viewconf = JSON.parse(JSON.stringify(geneAnnotationsOnly1));
      viewconf.views[0].genomePositionSearchBox = {
        chromInfoPath:
          'https://s3.amazonaws.com/pkerp/public/gpsb/small.chrom.sizes',
        hideAvailableAssemblies: true,
        visible: true,
      };
      viewconf.trackSourceServers = [];

      [div, api] = createElementAndApi(viewconf, {});
      hgc = api.getComponent();

      waitForJsonComplete(() => {
        const positionText = hgc.genomePositionSearchBoxes.aa.positionText;

        expect(hgc.genomePositionSearchBoxes.aa.assemblyPickButton).to.be
          .undefined;

        expect(positionText.indexOf('bar')).to.be.greaterThan(-1);
        done();
      });
    });

    afterEach(() => {
      api.destroy();
      removeDiv(div);
      api = undefined;
      div = undefined;
      hgc = null;
    });
  });

  describe('Base genome position search box test', () => {
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

      hgc = Enzyme.mount(
        <HiGlassComponent
          options={{ bounded: false }}
          viewConfig={geneAnnotationsOnly1}
        />,
        { attachTo: div },
      );

      hgc.update();
      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Searches for cdkn2b-as1', (done) => {
      const firstDomain = hgc.instance().xScales.aa.domain();

      hgc
        .instance()
        .genomePositionSearchBoxes.aa.onAutocompleteChange({}, 'cdkn2b-as1');
      hgc.update();

      hgc.instance().genomePositionSearchBoxes.aa.buttonClick();
      hgc.update();

      waitForJsonComplete(() => {
        waitForTransitionsFinished(hgc.instance(), () => {
          const secondDomain = hgc.instance().xScales.aa.domain();
          // make sure that we zoomed somwhere

          expect(firstDomain[0]).not.to.equal(secondDomain[0]);
          expect(firstDomain[1]).not.to.equal(secondDomain[1]);
          done();
        });
      });
    });

    it('Cleans up', () => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
        hgc = null;
      }

      if (div) {
        global.document.body.removeChild(div);
        div = null;
      }
    });
  });

  describe('Starting with no genome position search box', () => {
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

      hgc = Enzyme.mount(
        <HiGlassComponent options={{ bounded: false }} viewConfig={noGPSB} />,
        { attachTo: div },
      );

      hgc.update();
      waitForTilesLoaded(hgc.instance(), done);
    });

    it('Makes the search box visible', (done) => {
      // TODO: This may create state which is necessary for the following tests.
      // In which case, it should be a `before` or `before_each` and not `it`.
      // let assemblyPickButton =
      hgc.find('.assembly-pick-button');
      // expect(assemblyPickButton.length).to.equal(0);
      hgc.instance().handleTogglePositionSearchBox('aa');
      hgc.update();
      // assemblyPickButton =
      hgc.find('.assembly-pick-button');
      // expect(assemblyPickButton.length).to.equal(1);
      waitForJsonComplete(done);
    });

    it('Makes sure that the search box points to mm9', () => {
      hgc.update();
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.selectedAssembly,
      ).to.equal('mm9');
    });

    it('Switch the selected genome to dm3', (done) => {
      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('dm3');
      hgc.update();

      waitForJsonComplete(done);
    });

    it('Searches for the w gene', (done) => {
      // this gene previously did nothing when searching for it
      hgc.instance().genomePositionSearchBoxes.aa.onAutocompleteChange({}, 'w');

      waitForJsonComplete(done);
    });

    it('Makes sure that no genes are loaded', () => {
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.genes.length,
      ).to.equal(0);
    });

    it('Switch the selected genome to mm9', (done) => {
      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('mm9');
      hgc.update();

      waitForJsonComplete(done);
    });

    it('Searches for the Clock gene', (done) => {
      // this gene previously did nothing when searching for it
      hgc
        .instance()
        .genomePositionSearchBoxes.aa.onAutocompleteChange({}, 'Clock');

      waitForJsonComplete(done);
    });

    it('Clicks the search positions', (done) => {
      hgc.instance().genomePositionSearchBoxes.aa.buttonClick();

      waitForJsonComplete(() => {
        waitForTransitionsFinished(hgc.instance(), () => {
          waitForTilesLoaded(hgc.instance(), done);
        });
      });
    });

    it('Expects the view to have changed location (1)', () => {
      const { zoomTransform } = hgc.instance().tiledPlots.aa.trackRenderer;

      expect(zoomTransform.k - 47).to.be.lessThan(1);
      expect(zoomTransform.x - 2224932).to.be.lessThan(1);
    });

    it('Checks that autocomplete fetches some genes', (done) => {
      hgc.instance().genomePositionSearchBoxes.aa.onAutocompleteChange({}, 'T');
      hgc.update();

      waitForJsonComplete(done);
    });

    it('Checks the selected genes', (done) => {
      // don't use the human autocomplete id
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.autocompleteId,
      ).not.to.equal('OHJakQICQD6gTD7skx4EWA');
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.genes[0].geneName,
      ).to.equal('Gt(ROSA)26Sor');

      waitForJsonComplete(done);
    });

    it('Switch the selected genome to hg19', (done) => {
      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('hg19');
      hgc.update();

      waitForJsonComplete(done);
    });

    it('Sets the text to TP53', (done) => {
      hgc
        .instance()
        .genomePositionSearchBoxes.aa.onAutocompleteChange({}, 'TP53');
      hgc.update();

      waitForJsonComplete(done);
    });

    it('Clicks on the search button', (done) => {
      hgc.instance().genomePositionSearchBoxes.aa.buttonClick();

      waitForJsonComplete(() => {
        waitForTransitionsFinished(hgc.instance(), () => {
          waitForTilesLoaded(hgc.instance(), done);
        });
      });
    });

    it('Expects the view to have changed location (2)', () => {
      const { zoomTransform } = hgc.instance().tiledPlots.aa.trackRenderer;

      expect(zoomTransform.k - 234).to.be.lessThan(1);
      expect(zoomTransform.x + 7656469).to.be.lessThan(1);
    });

    it('Ensures that the autocomplete has changed', (done) => {
      hgc.instance().genomePositionSearchBoxes.aa.onAutocompleteChange({}, '');
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.autocompleteId,
      ).to.equal('OHJakQICQD6gTD7skx4EWA');

      waitForJsonComplete(done);
    });

    it('Ensure that newly loaded genes are from hg19', () => {
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.genes[0].geneName,
      ).to.equal('TP53');
    });

    it('Switches back to mm9', (done) => {
      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('mm9');
      hgc.update();

      waitForJsonComplete(done);
    });

    it('Mock type something', (done) => {
      hgc.instance().genomePositionSearchBoxes.aa.onAutocompleteChange({}, '');

      waitForJsonComplete(done);
    });

    it('Make sure it has mouse genes', () => {
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.genes[0].geneName,
      ).to.equal('Gt(ROSA)26Sor');
    });

    it('Switches back to hg19', (done) => {
      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('hg19');
      hgc.update();

      waitForJsonComplete(done);
    });

    it('Makes the search box invisible', (done) => {
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.selectedAssembly,
      ).to.equal('hg19');
      hgc.instance().handleTogglePositionSearchBox('aa');
      hgc.update();

      const assemblyPickButton = hgc.find('.assembly-pick-button');
      expect(assemblyPickButton.length).to.equal(0);

      waitForJsonComplete(done);
    });

    it('Makes the search box visible again', (done) => {
      hgc.instance().handleTogglePositionSearchBox('aa');
      hgc.update();

      waitForJsonComplete(done);
    });

    it('Ensures that selected assembly is hg19', () => {
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.selectedAssembly,
      ).to.equal('hg19');
    });

    it("checks that the div hasn't grown too much", () => {
      expect(div.clientHeight).to.be.lessThan(500);
    });

    it('Cleans up', () => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
        hgc = null;
      }

      if (div) {
        global.document.body.removeChild(div);
        div = null;
      }
    });
  });
});
