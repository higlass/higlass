// @ts-nocheck
/* eslint-env mocha */
import * as React from 'react';
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import {
  mountHGComponentAsync,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/test-helpers';

import HiGlassComponent from '../../app/scripts/HiGlassComponent';

import { testViewConfX1, project1D } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

const waitForTilesLoadedAsync = (hgcInstance) =>
  new Promise((resolve) => {
    waitForTilesLoaded(hgcInstance, () => resolve());
  });

describe('SVG Export', () => {
  let hgc = null;
  let div = null;

  before(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, testViewConfX1, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: false,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
  });

  it('Exports to SVG', () => {
    const svg = hgc.instance().createSVG();
    const svgText = new XMLSerializer().serializeToString(svg);

    expect(svgText.indexOf('rect')).to.be.greaterThan(0);
    // hgc.instance().handleExportSVG();
  });

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
      <HiGlassComponent options={{ bounded: false }} viewConfig={project1D} />,
      { attachTo: div },
    );

    hgc.update();
    await waitForTilesLoadedAsync(hgc.instance());
  });

  // it('Exports to SVG', (done) => {
  //   // const svg = hgc.instance().createSVG();
  //   // const svgText = new XMLSerializer().serializeToString(svg);
  //
  //   // expect(svgText.indexOf('dy="-17"')).to.be.greaterThan(0);
  //   // hgc.instance().handleExportSVG();
  //
  //   done();
  // });

  it('Replaces one of the views and tries to export again', () => {
    let { views } = hgc.instance().state;

    const newView = JSON.parse(JSON.stringify(views.aa));

    hgc.instance().handleCloseView('aa');
    ({ views } = hgc.instance().state);

    newView.uid = 'a2';
    newView.layout.i = 'a2';

    views.a2 = newView;

    hgc.instance().setState({ views });

    // this used to raise an error because the hgc.instance().tiledPlots
    // would maintain a reference to the closed view and we would try
    // to export it as SVG
    hgc.instance().createSVG();

    // hgc.instance().createSVG();
  });

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
      <HiGlassComponent options={{ bounded: false }} viewConfig={project1D} />,
      { attachTo: div },
    );

    hgc.update();
    await waitForTilesLoadedAsync(hgc.instance());
  });

  it('Exports to SVG', () => {
    const svg = hgc.instance().createSVG();
    const svgText = new XMLSerializer().serializeToString(svg);

    // check to make sure that the horizontal labels shifted down
    // the horizontal lines' labels should be shifted down
    expect(svgText.indexOf('dy="14"')).to.be.greaterThan(0);

    // check to make sure that chromosome tick labels are there
    expect(svgText.indexOf('chr17: 40,500,000')).to.be.greaterThan(0);

    // check to make sure that the chromosome ticks are present
    expect(svgText.indexOf('line x1')).to.be.greaterThan(0);
    expect(svgText.indexOf('#808080')).to.be.greaterThan(0);

    // hgc.instance().handleExportSVG();
  });
});
