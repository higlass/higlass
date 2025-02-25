// @ts-nocheck
import { afterEach, describe, expect, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import React from 'react';

import HiGlassComponent from '../app/scripts/HiGlassComponent';

import {
  waitForJsonComplete,
  waitForTilesLoaded,
  waitForTransitionsFinished,
} from '../app/scripts/test-helpers';

import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';
import emptyConf from './view-configs-more/emptyConf.json';

import { chromInfoTrack, geneAnnotationsOnly1, noGPSB } from './view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Genome position search box tests', () => {
  let hgc = null;
  let div = null;

  describe('No chromsizes shown', () => {
    /** Doesn't show chromsizes because there's no chromsizes track. */
    let api = null;
    afterEach(() => {
      api.destroy();
      removeDiv(div);
      api = undefined;
      div = undefined;
      hgc = null;
    });

    it("Doesn't show chromsizes", async () => {
      const viewconf = JSON.parse(JSON.stringify(emptyConf));
      viewconf.trackSourceServers = [];

      [div, api] = createElementAndApi(viewconf, {});
      hgc = api.getComponent();

      await new Promise((done) => {
        waitForJsonComplete(() => {
          const positionText = hgc.genomePositionSearchBoxes.aa.positionText;

          expect(hgc.genomePositionSearchBoxes.aa.assemblyPickButton).to.be
            .undefined;

          expect(positionText.indexOf('no chromosome')).to.be.greaterThan(-1);
          done(null);
        });
      });
    });
  });

  describe('Chromsizes shown', () => {
    /** Chromsizes are shown because there's a chromsizes track. */
    let api = null;
    afterEach(() => {
      api.destroy();
      removeDiv(div);
      api = undefined;
      div = undefined;
      hgc = null;
    });

    it('Shows chromsizes', async () => {
      const viewconf = JSON.parse(JSON.stringify(emptyConf));
      viewconf.trackSourceServers = [];
      viewconf.views[0].tracks.top = [chromInfoTrack];

      [div, api] = createElementAndApi(viewconf, {});
      hgc = api.getComponent();

      await new Promise((done) => {
        waitForJsonComplete(() => {
          const positionText = hgc.genomePositionSearchBoxes.aa.positionText;

          expect(hgc.genomePositionSearchBoxes.aa.assemblyPickButton).to.be
            .undefined;

          expect(positionText.indexOf('no chromosome')).to.be.equal(-1);
          expect(positionText.indexOf('chr1:0-100')).to.be.equal(0);
          done(null);
        });
      });
    });
  });

  describe.only('Search for a specific gene', () => {
    it('Cleans up previously created instances and mounts a new component', async () => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      const viewconf = JSON.parse(JSON.stringify(geneAnnotationsOnly1));
      viewconf.trackSourceServers = [];
      viewconf.views[0].tracks.top.push(chromInfoTrack);

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute('style', 'width:800px;background-color: lightgreen');
      div.setAttribute('id', 'simple-hg-component');

      hgc = Enzyme.mount(
        <HiGlassComponent options={{ bounded: false }} viewConfig={viewconf} />,
        { attachTo: div },
      );

      hgc.update();
      await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
    });

    it('Searches for cdkn2b-as1', async () => {
      const firstDomain = hgc.instance().xScales.aa.domain();

      hgc
        .instance()
        .genomePositionSearchBoxes.aa.onAutocompleteChange({}, 'cdkn2b-as1');
      hgc.update();

      hgc.instance().genomePositionSearchBoxes.aa.buttonClick();
      hgc.update();

      await new Promise((done) => {
        waitForJsonComplete(() => {
          waitForTransitionsFinished(hgc.instance(), () => {
            const secondDomain = hgc.instance().xScales.aa.domain();
            // make sure that we zoomed somwhere
            expect(firstDomain[0]).not.to.equal(secondDomain[0]);
            expect(firstDomain[1]).not.to.equal(secondDomain[1]);
            done(null);
          });
        });
      });
    });

    it('Adds a new annotations track', async () => {
      const viewUid = 'aa';
      const position = 'top';
      const newTrack = {
        server: 'http://higlass.io/api/v1',
        tilesetUid: 'GUm5aBiLRCyz2PsBea7Yzg',
        uid: 'e8H0Eve5TRWlc6XymPQejg',
        type: 'horizontal-gene-annotations',
        options: {
          labelColor: 'black',
          labelPosition: 'hidden',
          plusStrandColor: 'blue',
          minusStrandColor: 'red',
          name: 'Gene Annotations (mm9)',
          coordSystem: 'mm9',
        },
        width: 20,
        height: 60,
      };

      hgc.instance().handleTrackAdded(viewUid, newTrack, position, null);
      hgc.setState(hgc.instance().state);
      const positionText = hgc.genomePositionSearchBoxes.aa.positionText;

      expect(positionText.indexOf('multiple annotation')).to.be.greaterThan(-1);
      done(null);
    });

    it();

    it('Ensures that the autocomplete has changed', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.onAutocompleteChange({}, '');
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.autocompleteId,
      ).to.not.equal('OHJakQICQD6gTD7skx4EWA');

      await new Promise((done) => waitForJsonComplete(done));
    });

    it('Mock type something', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.onAutocompleteChange({}, '');
      await new Promise((done) => waitForJsonComplete(done));
    });

    it('Make sure it has mouse genes', () => {
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.genes[0].geneName,
      ).to.equal('Gt(ROSA)26Sor');
    });

    it('Cleans up', () => {
      // if (hgc) {
      //   hgc.unmount();
      //   hgc.detach();
      //   hgc = null;
      // }
      // if (div) {
      //   global.document.body.removeChild(div);
      //   div = null;
      // }
    });
  });

  /**
   * Skipping this large test for now because much of the switching
   * assembly functionality has been removed in higlass 2.0.
   *
   * We still need to test that:
   * [ ] - Removing a chromsizes track sets the search box back to "no chromosomes"
   * [ ] - Changing the chromsizes changes the displayed position
   * [ ] - Changing the gene annotations changes the search results
   * [ ] - Ideally we would check that the chromsizes of the gene annotations tileset info
   *       and the chromsizes file match
   */
  describe.skip('Starting with no genome position search box', () => {
    it('Cleans up previously created instances and mounts a new component', async () => {
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
      await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
    });

    it('Makes the search box visible', async () => {
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
      await new Promise((done) => waitForJsonComplete(done));
    });

    it('Makes sure that the search box points to mm9', () => {
      hgc.update();
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.selectedAssembly,
      ).to.equal('mm9');
    });

    it('Switch the selected genome to dm3', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('dm3');
      hgc.update();

      await new Promise((done) => waitForJsonComplete(done));
    });

    it('Searches for the w gene', async () => {
      // this gene previously did nothing when searching for it
      hgc.instance().genomePositionSearchBoxes.aa.onAutocompleteChange({}, 'w');

      await new Promise((done) => waitForJsonComplete(done));
    });

    it('Makes sure that no genes are loaded', () => {
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.genes.length,
      ).to.equal(0);
    });

    it('Switch the selected genome to mm9', async (done) => {
      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('mm9');
      hgc.update();
      await new Promise((done) => waitForJsonComplete(done));
    });

    it('Searches for the Clock gene', async () => {
      // this gene previously did nothing when searching for it
      hgc
        .instance()
        .genomePositionSearchBoxes.aa.onAutocompleteChange({}, 'Clock');
      await new Promise((done) => waitForJsonComplete(done));
    });

    it('Clicks the search positions', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.buttonClick();
      await new Promise((done) => {
        waitForJsonComplete(() => {
          waitForTransitionsFinished(hgc.instance(), () => {
            waitForTilesLoaded(hgc.instance(), done);
          });
        });
      });
    });

    it('Expects the view to have changed location (1)', () => {
      const { zoomTransform } = hgc.instance().tiledPlots.aa.trackRenderer;

      expect(zoomTransform.k - 47).to.be.lessThan(1);
      expect(zoomTransform.x - 2224932).to.be.lessThan(1);
    });

    it('Checks that autocomplete fetches some genes', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.onAutocompleteChange({}, 'T');
      hgc.update();
      await new Promise((done) => waitForJsonComplete(done));
    });

    it('Checks the selected genes', async () => {
      // don't use the human autocomplete id
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.autocompleteId,
      ).not.to.equal('OHJakQICQD6gTD7skx4EWA');
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.genes[0].geneName,
      ).to.equal('Gt(ROSA)26Sor');
      await new Promise((done) => waitForJsonComplete(done));
    });

    it('Switch the selected genome to hg19', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('hg19');
      hgc.update();
      await new Promise((done) => waitForJsonComplete(done));
    });

    it('Sets the text to TP53', async () => {
      hgc
        .instance()
        .genomePositionSearchBoxes.aa.onAutocompleteChange({}, 'TP53');
      hgc.update();
      await new Promise((done) => waitForJsonComplete(done));
    });

    it('Clicks on the search button', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.buttonClick();
      await new Promise((done) => {
        waitForJsonComplete(() => {
          waitForTransitionsFinished(hgc.instance(), () => {
            waitForTilesLoaded(hgc.instance(), done);
          });
        });
      });
    });

    it('Expects the view to have changed location (2)', () => {
      const { zoomTransform } = hgc.instance().tiledPlots.aa.trackRenderer;

      expect(zoomTransform.k - 234).to.be.lessThan(1);
      expect(zoomTransform.x + 7656469).to.be.lessThan(1);
    });

    it('Ensures that the autocomplete has changed', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.onAutocompleteChange({}, '');
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.autocompleteId,
      ).to.equal('OHJakQICQD6gTD7skx4EWA');

      await new Promise((done) => waitForJsonComplete(done));
    });

    it('Ensure that newly loaded genes are from hg19', () => {
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.genes[0].geneName,
      ).to.equal('TP53');
    });

    it('Switches back to mm9', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('mm9');
      hgc.update();
      await new Promise((done) => waitForJsonComplete(done));
    });

    it('Mock type something', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.onAutocompleteChange({}, '');
      await new Promise((done) => waitForJsonComplete(done));
    });

    it('Make sure it has mouse genes', () => {
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.genes[0].geneName,
      ).to.equal('Gt(ROSA)26Sor');
    });

    it('Switches back to hg19', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('hg19');
      hgc.update();
      await new Promise((done) => waitForJsonComplete(done));
    });

    it('Makes the search box invisible', async () => {
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.selectedAssembly,
      ).to.equal('hg19');
      hgc.instance().handleTogglePositionSearchBox('aa');
      hgc.update();

      const assemblyPickButton = hgc.find('.assembly-pick-button');
      expect(assemblyPickButton.length).to.equal(0);
      await new Promise((done) => waitForJsonComplete(done));
    });

    it('Makes the search box visible again', async () => {
      hgc.instance().handleTogglePositionSearchBox('aa');
      hgc.update();
      await new Promise((done) => waitForJsonComplete(done));
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
