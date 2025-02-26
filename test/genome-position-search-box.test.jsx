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

/**
 *
 * Key tests for the simplified genome position search box component
 *
 * [x] - Removing a chromsizes track sets the search box back to "no chromosomes"
 * [x] - Changing the chromsizes changes the displayed position
 * [x] - Changing the gene annotations changes the search results
 * [ ] - Ideally we would check that the chromsizes of the gene annotations tileset info
 *       and the chromsizes file match
 */

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
      const errorText = hgc.instance().genomePositionSearchBoxes.aa.props.error;

      expect(errorText.indexOf('multiple annotation')).to.be.greaterThan(-1);
    });

    it('Removes the previous (hg19) annotations track', async () => {
      hgc.instance().handleCloseTrack('aa', 'genes1');
      hgc.setState(hgc.instance().state);

      const errorText = hgc.instance().genomePositionSearchBoxes.aa.props.error;
      expect(errorText).to.equal(false);
    });

    it('Ensures that the autocomplete has changed', async () => {
      hgc.instance().genomePositionSearchBoxes.aa.onAutocompleteChange({}, '');
      expect(
        hgc.instance().genomePositionSearchBoxes.aa.props.autocompleteId,
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

    it('Changes the chromsizes track', async (done) => {
      hgc.instance().genomePositionSearchBoxes.aa.buttonClick();

      // First check the original position
      await new Promise((done) => {
        waitForJsonComplete(() => {
          waitForTransitionsFinished(hgc.instance(), () => {
            const positionText1 =
              hgc.instance().genomePositionSearchBoxes.aa.positionText;

            expect(positionText1.indexOf('chr9:21,963,212')).to.be.equal(0);
            done(null);
          });
        });
      });

      // Now change the chromsizes track
      hgc.instance().handleCloseTrack('aa', chromInfoTrack.uid);

      const newTrack = {
        server: 'http://higlass.io/api/v1',
        tilesetUid: 'NyITQvZsS_mOFNlz5C2LJg',
        uid: 'hcl1',
        type: 'horizontal-chromosome-labels',
        options: {
          showMousePosition: false,
          mousePositionColor: '#999999',
          color: '#777777',
          stroke: '#FFFFFF',
          fontSize: 12,
          fontIsAligned: false,
        },
        width: 1173,
        height: 30,
      };

      hgc.instance().handleTrackAdded('aa', newTrack, 'top', null);
      hgc.setState(hgc.instance().state);

      // Check that we have a new location
      await new Promise((done) => {
        waitForJsonComplete(() => {
          waitForTransitionsFinished(hgc.instance(), () => {
            const positionText1 =
              hgc.instance().genomePositionSearchBoxes.aa.positionText;

            expect(positionText1.indexOf('chr9:21,963,212')).to.be.equal(-1);
            done(null);
          });
        });
      });
    });

    it('Removes the chromsizes track', () => {
      hgc.instance().handleCloseTrack('aa', 'hcl1');
      hgc.setState(hgc.instance().state);

      const errorText = hgc.instance().genomePositionSearchBoxes.aa.props.error;

      // Should be "no chromosome track present" but we can settle for false
      expect(errorText).to.not.equal(false);
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
