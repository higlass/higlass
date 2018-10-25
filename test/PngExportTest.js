/* eslint-env node, mocha */
import {
  configure,
  mount,
  // render,
  ReactWrapper,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';
import { select } from 'd3-selection';
import React from 'react';
import ReactDOM from 'react-dom';
import slugid from 'slugid';

import HiGlassComponent from '../app/scripts/HiGlassComponent';
import HeatmapOptions from '../app/scripts/HeatmapOptions';

// Utils
import {
  scalesCenterAndK,
  totalTrackPixelHeight,
  getTrackByUid,
  getTrackObjectFromHGC,
  getTiledPlot,
  waitForJsonComplete,
  waitForTilesLoaded,
  waitForTransitionsFinished,
} from '../app/scripts/utils';

// View configs
import {
  // paperFigure1,
  osmConf,
  geneAnnotationsOnly,
  geneAnnotationsOnly1,
  annotationsTilesView,
  horizontalAndVerticalMultivec,
  exportDataConfig,
  invalidTrackConfig,
  divergentTrackConfig,
  divisionViewConfig,
  simpleCenterViewConfig,
  rectangleDomains,
  threeViews,
  project1D,
  noGPSB,
  onlyGPSB,
  chromInfoTrack,
  heatmapTrack,
  twoViewConfig,
  oneViewConfig,
  oneTrackConfig,
  oneZoomedOutViewConf,
  // valueIntervalTrackViewConf,
  horizontalDiagonalTrackViewConf,
  horizontalHeatmapTrack,
  largeHorizontalHeatmapTrack,
  verticalHeatmapTrack,
  chromosomeGridTrack,
  testViewConfX1,
  testViewConfX2,
} from './view-configs';

configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let hgc = null;
  let div = null;

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

  describe('Export SVG properly', () => {
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
        viewConfig={testViewConfX1}
      />, { attachTo: div });

      hgc.update();
      waitForTilesLoaded(hgc.instance(), done);
    });

    it ("Exports to SVG", (done) => {
      let svg = hgc.instance().createSVG();
      let svgText = new XMLSerializer().serializeToString(svg);

      expect(svgText.indexOf('rect')).to.be.above(0);
      // hgc.instance().handleExportSVG();
      //

      done();
    });
  });
});