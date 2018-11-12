/* eslint-env node, mocha */
import {
  configure,
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';
import {
  oneViewConfig
} from './view-configs';

const localViewConf = 
{
  "editable": true,
  "zoomFixed": false,
  "trackSourceServers": [
    "//localhost:8000/api/v1"
  ],
  "exportViewUrl": "/api/v1/viewconfs",
  "views": [
    {
      "uid": "aa",
      "initialXDomain": [
        3.725290298461914e-9,
        3100000000
      ],
      "tracks": {
        "top": [],
        "left": [],
        "center": [],
        "right": [],
        "bottom": [],
        "whole": [],
        "gallery": []
      }
    }
  ]
}

// Utils
import {
  mountHGComponent,
  removeHGComponent,
  waitForTilesLoaded,
  waitForJsonComplete,
} from '../app/scripts/utils';

configure({ adapter: new Adapter() });

describe('Simple HiGlassComponent', () => {
  let hgc = null;
  let div = null;

  describe('Tileset checkbox tests', () => {
    beforeAll((done) => {
      ([div, hgc] = mountHGComponent(div, hgc,
        localViewConf,
        done,
        {
          style: 'width:800px; height:400px; background-color: lightgreen',
          bounded: true,
        })
      );
    });

    it("Opens the Add Track Modal", (done) => {
      const tiledPlot = hgc.instance().tiledPlots.aa;
      tiledPlot.handleAddTrack('center');

      hgc.update();

      done();
    });

    afterAll((done) => {
      // removeHGComponent(div);
      div = null;
 
      done();
    });
  });

  return;

  describe('Multiple track addition', () => {
    let atm = null;

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

    it('should open the AddTrackModal', (done) => {
      // this was to test an example from the higlass-website demo page
      // where the issue was that the genome position search box was being
      // styled with a margin-bottom of 10px, fixed by setting the style of
      // genome-position-search to specify margin-bottom app/styles/GenomePositionSearchBox.css
      const tiledPlot = hgc.instance().tiledPlots.aa;
      tiledPlot.handleAddTrack('top');

      hgc.update();

      atm = tiledPlot.addTrackModal;
      const inputField = ReactDOM.findDOMNode(atm.tilesetFinder.searchBox);

      // make sure the input field is equal to the document's active element
      // e.g. that it has focus
      expect(inputField).to.be.eql(document.activeElement);

      waitForJsonComplete(done);
    });

    it('should select one plot type and double click', (done) => {
      const tilesetFinder = atm.tilesetFinder;
      tilesetFinder.handleSelectedOptions(['http://higlass.io/api/v1/CQMd6V_cRw6iCI_-Unl3PQ']);
      hgc.update();

      tilesetFinder.props.onDoubleClick(tilesetFinder.state.options['http://higlass.io/api/v1/CQMd6V_cRw6iCI_-Unl3PQ']);

      waitForJsonComplete(done);
    });

    it('should reopen the AddTrackModal', (done) => {
      // open up the add track dialog for the next tests
      const tiledPlot = hgc.instance().tiledPlots.aa;
      tiledPlot.handleAddTrack('top');
      hgc.update();
      atm = tiledPlot.addTrackModal;
      waitForJsonComplete(done);
    });

    it('should select two different plot types', (done) => {
      const tilesetFinder = atm.tilesetFinder;

      tilesetFinder.handleSelectedOptions(['http://higlass.io/api/v1/TO3D5uHjSt6pyDPEpc1hpA', 'http://higlass.io/api/v1/Nn8aA4qbTnmaa-oGGbuE-A']);

      hgc.update();

      waitForTilesLoaded(hgc.instance(), done);
    });

    it('should add these plot types', (done) => {
      atm.handleSubmit();

      const tiledPlot = hgc.instance().tiledPlots.aa;
      tiledPlot.handleAddTrack('top');

      hgc.update();

      atm = tiledPlot.addTrackModal;

      waitForJsonComplete(done);
    });

    it('should select a few different tracks and check for the plot type selection', (done) => {
      const tilesetFinder = atm.tilesetFinder;

      tilesetFinder.handleSelectedOptions(['http://higlass.io/api/v1/CQMd6V_cRw6iCI_-Unl3PQ',
        'http://higlass.io/api/v1/GUm5aBiLRCyz2PsBea7Yzg']);

      hgc.update();

      let ptc = atm.plotTypeChooser;

      expect(ptc.AVAILABLE_TRACK_TYPES.length).to.eql(0);

      tilesetFinder.handleSelectedOptions(['http://higlass.io/api/v1/NNlxhMSCSnCaukAtdoKNXw',
        'http://higlass.io/api/v1/GGKJ59R-RsKtwgIgFohOhA']);

      hgc.update();

      ptc = atm.plotTypeChooser;


      // should just have the horizontal-heatmap track type
      expect(ptc.AVAILABLE_TRACK_TYPES.length).to.eql(1);

      done();
    });

    it('should add the selected tracks', (done) => {
      // atm.unmount();
      atm.handleSubmit();
      // hgc.update();
      const viewConf = JSON.parse(hgc.instance().getViewsAsString());

      expect(viewConf.views[0].tracks.top.length).to.eql(6);

      hgc.update();

      done();
    });

    afterAll((done) => {
      removeHGComponent(div);
      
      done();
    });

  });
});
