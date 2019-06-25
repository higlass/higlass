/* eslint-env node, jasmine */
import {
  configure,
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';
import {
  oneViewConfig
} from './view-configs';


// Utils
import {
  mountHGComponent,
  removeHGComponent,
  waitForTilesLoaded,
  waitForJsonComplete,
} from '../app/scripts/utils';

configure({ adapter: new Adapter() });

describe('Add Track', () => {
  let hgc = null;
  let div = null;

  describe('Multiple track addition', () => {
    beforeAll((done) => {
      ([div, hgc] = mountHGComponent(div, hgc,
        oneViewConfig,
        done,
        {
          style: 'width:800px; height:400px; background-color: lightgreen',
          bounded: true,
        })
      );
    });

    it('should have one top track', () => {
      const viewConf = JSON.parse(hgc.instance().getViewsAsString());
      expect(viewConf.views[0].tracks.top.length).to.eql(1);
      hgc.update();
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
      expect(document.activeElement.id).to.be.eql('higlass-tileset-finder-search-box');

      waitForJsonComplete(done);
    });

    it('should select one plot type and double click', (done) => {
      const { tilesetFinder } = hgc.instance().modalRef;

      tilesetFinder.handleSelectedOptions(
        ['http://higlass.io/api/v1/CQMd6V_cRw6iCI_-Unl3PQ']
      );
      hgc.update();

      tilesetFinder.props.onDoubleClick(
        tilesetFinder.state.options['http://higlass.io/api/v1/CQMd6V_cRw6iCI_-Unl3PQ']
      );
      hgc.update();

      waitForJsonComplete(done);
    });

    it('should have two top tracks', () => {
      const viewConf = JSON.parse(hgc.instance().getViewsAsString());
      expect(viewConf.views[0].tracks.top.length).to.eql(2);
      hgc.update();
    });

    it('should reopen the AddTrackModal', (done) => {
      // open up the add track dialog for the next tests
      const tiledPlot = hgc.instance().tiledPlots.aa;
      tiledPlot.handleAddTrack('top');
      hgc.update();
      expect(document.activeElement.id).to.be.eql('higlass-tileset-finder-search-box');
      waitForJsonComplete(done);
    });

    it('should select two different plot types', (done) => {
      const { tilesetFinder } = hgc.instance().modalRef;

      tilesetFinder.handleSelectedOptions([
        'http://higlass.io/api/v1/TO3D5uHjSt6pyDPEpc1hpA',
        'http://higlass.io/api/v1/Nn8aA4qbTnmaa-oGGbuE-A'
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

    it('should have one four tracks', () => {
      const viewConf = JSON.parse(hgc.instance().getViewsAsString());
      expect(viewConf.views[0].tracks.top.length).to.eql(4);
    });

    it('should select a few different tracks and check for the plot type selection', () => {
      const addTrackDialog = hgc.instance().modalRef;
      const { tilesetFinder } = addTrackDialog;

      tilesetFinder.handleSelectedOptions([
        'http://higlass.io/api/v1/CQMd6V_cRw6iCI_-Unl3PQ',
        'http://higlass.io/api/v1/GUm5aBiLRCyz2PsBea7Yzg'
      ]);

      hgc.update();

      expect(addTrackDialog.state.activeTab).to.eql('datasets');

      addTrackDialog.handleNext();
      hgc.update();

      expect(addTrackDialog.state.activeTab).to.eql('trackTypes');

      let ptc = addTrackDialog.plotTypeChooser;

      expect(ptc.availableTrackTypes.length).to.eql(0);

      tilesetFinder.handleSelectedOptions([
        'http://higlass.io/api/v1/NNlxhMSCSnCaukAtdoKNXw',
        'http://higlass.io/api/v1/GGKJ59R-RsKtwgIgFohOhA'
      ]);

      addTrackDialog.handleNext();
      hgc.update();

      ptc = addTrackDialog.plotTypeChooser;

      // console.warn('ptc.AVAILABLE_TRACK_TYPES', ptc.AVAILABLE_TRACK_TYPES);
      // should just have the horizontal-heatmap track type
      expect(ptc.availableTrackTypes.length).to.eql(3);
    });

    it('should add the selected tracks', () => {
      hgc.instance().modalRef.handleSubmitAndClose();
      const viewConf = JSON.parse(hgc.instance().getViewsAsString());

      expect(viewConf.views[0].tracks.top.length).to.eql(6);

      hgc.update();
    });

    afterAll(() => {
      removeHGComponent(div);
    });
  });
});
