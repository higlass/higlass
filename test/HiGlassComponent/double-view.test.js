// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import { select } from 'd3-selection';
import ReactDOM from 'react-dom';

import {
  mountHGComponentAsync,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/test-helpers';
import { getTrackByUid, getTrackObjectFromHGC } from '../../app/scripts/utils';

import { chromInfoTrack, twoViewConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Double view', () => {
  let hgc = null;
  let div = null;

  beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, twoViewConfig, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  afterAll(async () => {
    // removeHGComponent(div);
  });

  it('has a colorbar', () => {
    const heatmap =
      hgc.instance().tiledPlots.aa.trackRenderer.trackDefObjects.c1.trackObject
        .createdTracks.heatmap1;
    expect(heatmap.pColorbarArea.x).to.be.lessThan(heatmap.dimensions[0] / 2);

    const selection = select(div).selectAll('.selection');

    // we expect a colorbar selector brush to be visible
    // in both views
    expect(selection.size()).to.equal(2);
  });

  it('hides the colorbar', () => {
    const { views } = hgc.instance().state;

    const track = getTrackByUid(views.aa.tracks, 'heatmap1');
    track.options.colorbarPosition = 'hidden';

    hgc.instance().setState({ views });

    const selection = select(ReactDOM.findDOMNode(hgc.instance())).selectAll(
      '.selection',
    );

    // we expect a colorbar selector brush to be hidden
    // in one of the views
    expect(selection.size()).to.equal(1);

    track.options.colorbarPosition = 'topLeft';
    hgc.instance().setState({ views });
  });

  it('changes the colorbar color when the heatmap colormap is changed', () => {
    // hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);
    const newOptions = {
      colorRange: ['white', 'black'],
    };

    hgc.instance().handleTrackOptionsChanged('aa', 'heatmap1', newOptions);

    // const svg = getTrackObjectFromHGC(hgc.instance(), 'aa', 'heatmap1').exportSVG()[0];
    // hgc.instance().handleExportSVG();

    // how do we test for what's drawn in Pixi?'

    const oldOptions = {
      colorRange: [
        'white',
        'rgba(245,166,35,1.0)',
        'rgba(208,2,27,1.0)',
        'black',
      ],
    };

    hgc.instance().handleTrackOptionsChanged('aa', 'heatmap1', oldOptions);
  });

  it('switches between log and linear scales', () => {
    const newOptions = {
      labelColor: 'red',
      labelPosition: 'hidden',
      axisPositionHorizontal: 'right',
      lineStrokeColor: 'blue',
      name: 'wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile',
      valueScaling: 'linear',
    };

    expect(
      getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1').options.valueScaling,
    ).to.equal('log');
    hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);
    expect(
      getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1').options.valueScaling,
    ).to.equal('linear');

    newOptions.valueScaling = 'log';
    hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

    // hgc.update();
  });

  it('exports SVG', () => {
    const svg = hgc.instance().createSVG();
    const svgText = new XMLSerializer().serializeToString(svg);

    // hgc.instance().handleExportSVG();

    // Make sure we have an axis that is offset from the origin
    // expect(svgText.indexOf('id="axis" transform="translate(390, 68)"')).to.be.greaterThan(0);

    // make sure that we have this color in the colorbar (this is part of the custard
    // color map)
    expect(svgText.indexOf('rgb(231, 104, 32)')).to.be.greaterThan(0);

    // make sure that this color, which is part of the afmhot colormap is not exported
    expect(svgText.indexOf('rgb(171, 43, 0)')).to.be.lessThan(0);

    const line1 =
      hgc.instance().tiledPlots.aa.trackRenderer.trackDefObjects.line1
        .trackObject;

    const axis = line1.axis.exportAxisRightSVG(
      line1.valueScale,
      line1.dimensions[1],
    );
    const axisText = new XMLSerializer().serializeToString(axis);

    // hgc.instance().handleExportSVG();

    // let axis = svg.getElementById('axis');
    // make sure we have a tick mark for 200000
    expect(axisText.indexOf('1e+5')).to.be.greaterThan(0);
  });

  it('Adds a chromInfo track', async () => {
    // this test was here to visually make sure that the HorizontalChromosomeAxis
    // was rendered after being drawn
    hgc.instance().handleTrackAdded('view2', chromInfoTrack, 'top');

    hgc.instance().tiledPlots.view2.render();
    hgc
      .instance()
      .tiledPlots.view2.trackRenderer.syncTrackObjects(
        hgc.instance().tiledPlots.view2.positionedTracks(),
      );
    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('splits one of the views', async () => {
    hgc.instance().handleAddView(twoViewConfig.views[0]);
    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('splits one of the views1', async () => {
    hgc.instance().handleAddView(twoViewConfig.views[0]);
    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
  it('splits one of the views2', async () => {
    hgc.instance().handleAddView(twoViewConfig.views[0]);
    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
  it('splits one of the views3', async () => {
    hgc.instance().handleAddView(twoViewConfig.views[0]);
    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
  it('splits one of the views3', async () => {
    hgc.instance().handleAddView(twoViewConfig.views[0]);
    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
  it('splits one of the views3', async () => {
    hgc.instance().handleAddView(twoViewConfig.views[0]);
    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
  it('splits one of the views3', async () => {
    hgc.instance().handleAddView(twoViewConfig.views[0]);
    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
  it('splits one of the views3', async () => {
    hgc.instance().handleAddView(twoViewConfig.views[0]);
    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
  it('splits one of the views3', async () => {
    hgc.instance().handleAddView(twoViewConfig.views[0]);
    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
  it('splits one of the views3', async () => {
    hgc.instance().handleAddView(twoViewConfig.views[0]);
    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
  it('splits one of the views3', async () => {
    hgc.instance().handleAddView(twoViewConfig.views[0]);
    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
});
