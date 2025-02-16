// @ts-nocheck
import * as vi from 'vitest';

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

import { geneAnnotationsOnly1, noGPSB } from './view-configs';

Enzyme.configure({ adapter: new Adapter() });

vi.describe('Genome position search box tests', () => {
  let hgc = null;
  let div = null;

  vi.describe('Default chromsizes', () => {
    let api = null;
    vi.afterEach(() => {
      api.destroy();
      removeDiv(div);
      api = undefined;
      div = undefined;
      hgc = null;
    });

    vi.it('are loaded and displayed', async () => {
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

      await new Promise((done) => {
        waitForJsonComplete(() => {
          const positionText = hgc.genomePositionSearchBoxes.aa.positionText;

          vi.expect(hgc.genomePositionSearchBoxes.aa.assemblyPickButton).to.be
            .undefined;

          vi.expect(positionText.indexOf('bar')).to.be.greaterThan(-1);
          done(null);
        });
      });
    });
  });

  vi.describe('Base genome position search box test', () => {
    vi.it(
      'Cleans up previously created instances and mounts a new component',
      async () => {
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
        await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
      },
    );

    vi.it('Searches for cdkn2b-as1', async () => {
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
            vi.expect(firstDomain[0]).not.to.equal(secondDomain[0]);
            vi.expect(firstDomain[1]).not.to.equal(secondDomain[1]);
            done(null);
          });
        });
      });
    });

    vi.it('Cleans up', () => {
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

  vi.describe('Starting with no genome position search box', () => {
    vi.it(
      'Cleans up previously created instances and mounts a new component',
      async () => {
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
      },
    );

    vi.it('Makes the search box visible', async () => {
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

    vi.it('Makes sure that the search box points to mm9', () => {
      hgc.update();
      vi.expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.selectedAssembly,
      ).to.equal('mm9');
    });

    vi.it('Switch the selected genome to dm3', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('dm3');
      hgc.update();

      await new Promise((done) => waitForJsonComplete(done));
    });

    vi.it('Searches for the w gene', async () => {
      // this gene previously did nothing when searching for it
      hgc.instance().genomePositionSearchBoxes.aa.onAutocompleteChange({}, 'w');

      await new Promise((done) => waitForJsonComplete(done));
    });

    vi.it('Makes sure that no genes are loaded', () => {
      vi.expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.genes.length,
      ).to.equal(0);
    });

    vi.it('Switch the selected genome to mm9', async (done) => {
      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('mm9');
      hgc.update();
      await new Promise((done) => waitForJsonComplete(done));
    });

    vi.it('Searches for the Clock gene', async () => {
      // this gene previously did nothing when searching for it
      hgc
        .instance()
        .genomePositionSearchBoxes.aa.onAutocompleteChange({}, 'Clock');
      await new Promise((done) => waitForJsonComplete(done));
    });

    vi.it('Clicks the search positions', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.buttonClick();
      await new Promise((done) => {
        waitForJsonComplete(() => {
          waitForTransitionsFinished(hgc.instance(), () => {
            waitForTilesLoaded(hgc.instance(), done);
          });
        });
      });
    });

    vi.it('Expects the view to have changed location (1)', () => {
      const { zoomTransform } = hgc.instance().tiledPlots.aa.trackRenderer;

      vi.expect(zoomTransform.k - 47).to.be.lessThan(1);
      vi.expect(zoomTransform.x - 2224932).to.be.lessThan(1);
    });

    vi.it('Checks that autocomplete fetches some genes', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.onAutocompleteChange({}, 'T');
      hgc.update();
      await new Promise((done) => waitForJsonComplete(done));
    });

    vi.it('Checks the selected genes', async () => {
      // don't use the human autocomplete id
      vi.expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.autocompleteId,
      ).not.to.equal('OHJakQICQD6gTD7skx4EWA');
      vi.expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.genes[0].geneName,
      ).to.equal('Gt(ROSA)26Sor');
      await new Promise((done) => waitForJsonComplete(done));
    });

    vi.it('Switch the selected genome to hg19', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('hg19');
      hgc.update();
      await new Promise((done) => waitForJsonComplete(done));
    });

    vi.it('Sets the text to TP53', async () => {
      hgc
        .instance()
        .genomePositionSearchBoxes.aa.onAutocompleteChange({}, 'TP53');
      hgc.update();
      await new Promise((done) => waitForJsonComplete(done));
    });

    vi.it('Clicks on the search button', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.buttonClick();
      await new Promise((done) => {
        waitForJsonComplete(() => {
          waitForTransitionsFinished(hgc.instance(), () => {
            waitForTilesLoaded(hgc.instance(), done);
          });
        });
      });
    });

    vi.it('Expects the view to have changed location (2)', () => {
      const { zoomTransform } = hgc.instance().tiledPlots.aa.trackRenderer;

      vi.expect(zoomTransform.k - 234).to.be.lessThan(1);
      vi.expect(zoomTransform.x + 7656469).to.be.lessThan(1);
    });

    vi.it('Ensures that the autocomplete has changed', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.onAutocompleteChange({}, '');
      vi.expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.autocompleteId,
      ).to.equal('OHJakQICQD6gTD7skx4EWA');

      await new Promise((done) => waitForJsonComplete(done));
    });

    vi.it('Ensure that newly loaded genes are from hg19', () => {
      vi.expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.genes[0].geneName,
      ).to.equal('TP53');
    });

    vi.it('Switches back to mm9', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('mm9');
      hgc.update();
      await new Promise((done) => waitForJsonComplete(done));
    });

    vi.it('Mock type something', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.onAutocompleteChange({}, '');
      await new Promise((done) => waitForJsonComplete(done));
    });

    vi.it('Make sure it has mouse genes', () => {
      vi.expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.genes[0].geneName,
      ).to.equal('Gt(ROSA)26Sor');
    });

    vi.it('Switches back to hg19', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.handleAssemblySelect('hg19');
      hgc.update();
      await new Promise((done) => waitForJsonComplete(done));
    });

    vi.it('Makes the search box invisible', async () => {
      vi.expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.selectedAssembly,
      ).to.equal('hg19');
      hgc.instance().handleTogglePositionSearchBox('aa');
      hgc.update();

      const assemblyPickButton = hgc.find('.assembly-pick-button');
      vi.expect(assemblyPickButton.length).to.equal(0);
      await new Promise((done) => waitForJsonComplete(done));
    });

    vi.it('Makes the search box visible again', async () => {
      hgc.instance().handleTogglePositionSearchBox('aa');
      hgc.update();
      await new Promise((done) => waitForJsonComplete(done));
    });

    vi.it('Ensures that selected assembly is hg19', () => {
      vi.expect(
        hgc.instance().genomePositionSearchBoxes.aa.state.selectedAssembly,
      ).to.equal('hg19');
    });

    vi.it("checks that the div hasn't grown too much", () => {
      vi.expect(div.clientHeight).to.be.lessThan(500);
    });

    vi.it('Cleans up', () => {
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
