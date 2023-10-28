// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import { oneViewConfig } from './view-configs';

// Utils
import {
  mountHGComponent,
  removeHGComponent,
  waitForTilesLoaded,
  waitForJsonComplete,
} from '../app/scripts/test-helpers';

Enzyme.configure({ adapter: new Adapter() });

describe('Add track(s)', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, oneViewConfig, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  it('should open the AddTrackDialog', (done) => {
    // this was to test an example from the higlass-website demo page
    // where the issue was that the genome position search box was being
    // styled with a margin-bottom of 10px, fixed by setting the style of
    // genome-position-search to specify margin-bottom app/styles/GenomePositionSearchBox.css
    hgc.instance().tiledPlots.aa.handleAddTrack('top');
    hgc.update();

    // make sure the input field is equal to the document's active element
    // e.g. that it has focus
    expect(document.activeElement.className).to.be.eql(
      'tileset-finder-search-box',
    );

    waitForJsonComplete(done);
  });

  it('should select one plot type and double click', (done) => {
    const { tilesetFinder } = hgc.instance().modalRef;
    tilesetFinder.handleSelectedOptions([
      'http://higlass.io/api/v1/CQMd6V_cRw6iCI_-Unl3PQ',
    ]);
    hgc.update();

    tilesetFinder.props.onDoubleClick(
      tilesetFinder.state.options[
        'http://higlass.io/api/v1/CQMd6V_cRw6iCI_-Unl3PQ'
      ],
    );

    waitForJsonComplete(done);
  });

  it('should reopen the AddTrackModal', (done) => {
    // open up the add track dialog for the next tests
    const tiledPlot = hgc.instance().tiledPlots.aa;
    tiledPlot.handleAddTrack('top');
    hgc.update();
    expect(document.activeElement.className).to.be.eql(
      'tileset-finder-search-box',
    );
    waitForJsonComplete(done);
  });

  it('should select two different plot types', (done) => {
    const { tilesetFinder } = hgc.instance().modalRef;

    tilesetFinder.handleSelectedOptions([
      'http://higlass.io/api/v1/TO3D5uHjSt6pyDPEpc1hpA',
      'http://higlass.io/api/v1/Nn8aA4qbTnmaa-oGGbuE-A',
    ]);

    hgc.update();

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('should add these plot types', (done) => {
    hgc.instance().modalRef.handleSubmit();

    const tiledPlot = hgc.instance().tiledPlots.aa;
    tiledPlot.handleAddTrack('top');

    hgc.update();

    waitForJsonComplete(done);
  });

  it('should select a few different tracks and check for the plot type selection', () => {
    const { tilesetFinder } = hgc.instance().modalRef;

    tilesetFinder.handleSelectedOptions([
      'http://higlass.io/api/v1/CQMd6V_cRw6iCI_-Unl3PQ',
      'http://higlass.io/api/v1/GUm5aBiLRCyz2PsBea7Yzg',
    ]);

    hgc.update();

    let ptc = hgc.instance().modalRef.plotTypeChooser;

    expect(ptc.AVAILABLE_TRACK_TYPES.length).to.eql(0);

    tilesetFinder.handleSelectedOptions([
      'http://higlass.io/api/v1/NNlxhMSCSnCaukAtdoKNXw',
      'http://higlass.io/api/v1/GGKJ59R-RsKtwgIgFohOhA',
    ]);

    hgc.update();

    ptc = hgc.instance().modalRef.plotTypeChooser;

    // console.warn('ptc.AVAILABLE_TRACK_TYPES', ptc.AVAILABLE_TRACK_TYPES);
    // should just have the linear-heatmap track type
    expect(ptc.AVAILABLE_TRACK_TYPES.length).to.eql(3);

    tilesetFinder.handleSelectedOptions([
      // hg19 gene track
      'http://higlass.io/api/v1/OHJakQICQD6gTD7skx4EWA',
    ]);

    hgc.update();

    ptc = hgc.instance().modalRef.plotTypeChooser;

    // check that the selected plot type defaults to 'gene-annotations'
    expect(ptc.state.selectedPlotType.type).to.eql('gene-annotations');

    tilesetFinder.handleSelectedOptions([
      // hg19 gene track
      'http://higlass.io/api/v1/OHJakQICQD6gTD7skx4EWA',
      // GM12878-E116-H3K27me3.fc.signal track
      'http://higlass.io/api/v1/PdAaSdibTLK34hCw7ubqKA',
    ]);

    hgc.update();

    ptc = hgc.instance().modalRef.plotTypeChooser;

    // Make sure the plotTypeChooser is not shown since there are different datatypes
    expect(hgc.find('.plot-type-item').length).to.eql(0);
  });

  it('should add the selected tracks', () => {
    hgc.instance().modalRef.handleSubmit();
    const viewConf = JSON.parse(hgc.instance().getViewsAsString());

    expect(viewConf.views[0].tracks.top.length).to.eql(6);

    hgc.update();
  });

  it('remove existing tracks & add a new dm6 track: should zoom to dm6 extent', (done) => {
    // 1. Remove all existing tracks
    const { trackRenderer } = hgc.instance().tiledPlots.aa;

    Object.keys(trackRenderer.trackDefObjects).forEach((trackUid) => {
      hgc.instance().handleCloseTrack('aa', trackUid);
    });

    hgc.update();

    // 2. Add a new track
    hgc.instance().tiledPlots.aa.handleAddTrack('top');
    hgc.update();

    const { tilesetFinder } = hgc.instance().modalRef;

    tilesetFinder.handleSelectedOptions([
      // DM6 gene track
      'http://higlass.io/api/v1/B2skqtzdSLyWYPTYM8t8lQ',
    ]);

    const { plotTypeChooser } = hgc.instance().modalRef;

    plotTypeChooser.selectedPlotType = 'gene-annotations';

    hgc.instance().modalRef.handleSubmit();
    hgc.update();

    waitForTilesLoaded(hgc.instance(), () => {
      const { tilesetInfo } = Object.values(
        hgc.instance().tiledPlots.aa.trackRenderer.trackDefObjects,
      )[0].trackObject;

      const viewConf = JSON.parse(hgc.instance().getViewsAsString());

      expect(viewConf.views[0].initialXDomain[0]).to.eql(
        tilesetInfo.min_pos[0],
      );
      expect(viewConf.views[0].initialXDomain[1]).to.eql(
        tilesetInfo.max_pos[0],
      );

      done();
    });
  });

  it('remove existing track & add a new hg19 track: should zoom to hg19 extent', (done) => {
    // 1. Remove all existing tracks
    const { trackRenderer } = hgc.instance().tiledPlots.aa;

    Object.keys(trackRenderer.trackDefObjects).forEach((trackUid) => {
      hgc.instance().handleCloseTrack('aa', trackUid);
    });

    hgc.update();

    // 2. Add a new track
    hgc.instance().tiledPlots.aa.handleAddTrack('center');
    hgc.update();

    const { tilesetFinder } = hgc.instance().modalRef;

    tilesetFinder.handleSelectedOptions([
      // hg19 gm12878 heatmap
      'http://higlass.io/api/v1/CQMd6V_cRw6iCI_-Unl3PQ',
    ]);

    const { plotTypeChooser } = hgc.instance().modalRef;

    plotTypeChooser.selectedPlotType = 'heatmap';

    hgc.instance().modalRef.handleSubmit();
    hgc.update();

    waitForTilesLoaded(hgc.instance(), () => {
      const { tilesetInfo } = Object.values(
        hgc.instance().tiledPlots.aa.trackRenderer.trackDefObjects,
      )[0].trackObject.childTracks[0];

      const viewConf = JSON.parse(hgc.instance().getViewsAsString());

      expect(viewConf.views[0].initialXDomain[0]).to.eql(
        tilesetInfo.min_pos[0],
      );
      expect(viewConf.views[0].initialXDomain[1]).to.eql(
        tilesetInfo.max_pos[0],
      );

      done();
    });
  });

  it('zoom in, add another hg19 track: the visible domain should not have changed', (done) => {
    // hgc.instance().zoomTo('aa', 1e6, 1e7, 1e6, 1e7, 0);
    // Zoom to `[[1e6, 1e7],[1e6, 1e7]` and notify HiGlass
    hgc.instance().setCenters.aa(5500000, 5500000, 9000000, true, 0);
    hgc.update();

    const newXDomain = [
      ...JSON.parse(hgc.instance().getViewsAsString()).views[0].initialXDomain,
    ];

    hgc.instance().tiledPlots.aa.handleAddTrack('top');
    hgc.update();

    const { tilesetFinder } = hgc.instance().modalRef;

    tilesetFinder.handleSelectedOptions([
      // hg19 gene track
      'http://higlass.io/api/v1/OHJakQICQD6gTD7skx4EWA',
    ]);

    const { plotTypeChooser } = hgc.instance().modalRef;

    plotTypeChooser.selectedPlotType = 'gene-annotations';

    hgc.instance().modalRef.handleSubmit();
    hgc.update();

    waitForTilesLoaded(hgc.instance(), () => {
      const viewConf = JSON.parse(hgc.instance().getViewsAsString());

      expect(viewConf.views[0].initialXDomain[0]).to.eql(newXDomain[0]);
      expect(viewConf.views[0].initialXDomain[1]).to.eql(newXDomain[1]);

      done();
    });
  });

  after(() => {
    removeHGComponent(div);
  });
});
