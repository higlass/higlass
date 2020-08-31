import { configure, mount } from 'enzyme';
import React from 'react';
import Adapter from 'enzyme-adapter-react-16';

import {
  mountHGComponent,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/utils';

import HiGlassComponent from '../../app/scripts/HiGlassComponent';

import { testViewConfX1, project1D } from '../view-configs';

configure({ adapter: new Adapter() });

// import FetchMockHelper from '../utils/FetchMockHelper';

describe('SVG Export', () => {
  let hgc = null;
  let div = null;
  // const fetchMockHelper = new FetchMockHelper(null, 'higlass.io');

  beforeAll(async (done) => {
    // await fetchMockHelper.activateFetchMock();
    [div, hgc] = mountHGComponent(div, hgc, testViewConfX1, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: false,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  afterAll(async () => {
    removeHGComponent(div);
    // await fetchMockHelper.storeDataAndResetFetchMock();
  });

  it('Exports to SVG', () => {
    const svg = hgc.instance().createSVG();
    const svgText = new XMLSerializer().serializeToString(svg);

    expect(svgText.indexOf('rect')).toBeGreaterThan(0);
    // hgc.instance().handleExportSVG();
  });

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

    hgc = mount(
      <HiGlassComponent options={{ bounded: false }} viewConfig={project1D} />,
      { attachTo: div },
    );

    hgc.update();
    waitForTilesLoaded(hgc.instance(), done);
  });

  // it('Exports to SVG', (done) => {
  //   // const svg = hgc.instance().createSVG();
  //   // const svgText = new XMLSerializer().serializeToString(svg);
  //
  //   // expect(svgText.indexOf('dy="-17"')).toBeGreaterThan(0);
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

    hgc = mount(
      <HiGlassComponent options={{ bounded: false }} viewConfig={project1D} />,
      { attachTo: div },
    );

    hgc.update();
    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Exports to SVG', () => {
    const svg = hgc.instance().createSVG();
    const svgText = new XMLSerializer().serializeToString(svg);

    // check to make sure that the horizontal labels shifted down
    // the horizontal lines' labels should be shifted down
    expect(svgText.indexOf('dy="14"')).toBeGreaterThan(0);

    // check to make sure that chromosome tick labels are there
    expect(svgText.indexOf('chr17: 40,500,000')).toBeGreaterThan(0);

    // check to make sure that the chromosome ticks are present
    expect(svgText.indexOf('line x1')).toBeGreaterThan(0);
    expect(svgText.indexOf('#808080')).toBeGreaterThan(0);

    // hgc.instance().handleExportSVG();
  });
});
