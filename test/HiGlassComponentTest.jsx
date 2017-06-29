import {
    LONG_DRAG_TIMEOUT
} from '../app/scripts/config.js';

import {zoomTransform} from 'd3-zoom';

import { 
    mount, 
    render,
    ReactWrapper
} from 'enzyme';

import {
  scalesCenterAndK,
  dictValues,
  totalTrackPixelHeight
} from '../app/scripts/utils.js';

import { expect } from 'chai';
import {scaleLinear} from 'd3-scale';
import React from 'react';
import ReactDOM from 'react-dom';
import slugid from 'slugid';
import {AddTrackModal} from '../app/scripts/AddTrackModal.jsx';
import {HiGlassComponent} from '../app/scripts/HiGlassComponent.jsx';
import {HeatmapOptions} from '../app/scripts/HeatmapOptions.jsx';
import {
    paperFigure1,
    threeViews,
    fritzBug1,
    fritzBug2,
    project1D,
    noGPSB,
    onlyGPSB,
    chromInfoTrack,
    heatmapTrack,
    twoViewConfig,
    oneViewConfig,
    oneZoomedOutViewConf,
    valueIntervalTrackViewConf,
    horizontalDiagonalTrackViewConf,
    horizontalHeatmapTrack,
    largeHorizontalHeatmapTrack,
    verticalHeatmapTrack,
    chromosomeGridTrack,
    testViewConfX1,
    testViewConfX2
} from '../app/scripts/testViewConfs.js';

import {
    ZOOM_TRANSITION_DURATION
} from '../app/scripts/config.js';

const pageLoadTime = 1200;
const tileLoadTime = 600;
const shortLoadTime = 100; // for rapid changes, 
                           // just to make sure the screen can display what's happened

function testAsync(done) {
    // Wait two seconds, then set the flag to true
    setTimeout(function () {
        //flag = true;

        // Invoke the special done callback
        done();
    }, pageLoadTime);
}

function getTrackObject(hgc, viewUid, trackUid) {
    return hgc.instance().tiledPlots[viewUid].trackRenderer.getTrackObject(trackUid);
}

describe("Simple HiGlassComponent", () => {
    let hgc = null, div = null, atm=null;

    describe("Add overlay tracks", () => {
        it ('Cleans up previously created instances and mounts a new component', (done) => {
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

            beforeAll((done) => {
                // wait for the page to load
                testAsync(done);
            });

            hgc = mount(<HiGlassComponent 
                          options={{bounded: false}}
                          viewConfig={oneZoomedOutViewConf}
                        />, 
                {attachTo: div});

            setTimeout(done, tileLoadTime);
        });

        it ("Add the grid", (done) => {
            hgc.instance().handleTracksAdded('aa', [chromosomeGridTrack], 'center');

            hgc.instance().setState(hgc.instance().state);

            setTimeout(done, shortLoadTime);
        });

        it ("Should show a grid", (done) => {
            let outputJSON = JSON.parse(hgc.instance().getViewsAsString());

            expect(outputJSON.views[0].tracks['center'][0]).to.have.property('contents');

            // should have two tracks
            expect(outputJSON.views[0].tracks['center'][0].contents.length).to.be.above(1);

            setTimeout(done, shortLoadTime);
        });
    });

    describe("Colormap tests", () => {
        it ('Cleans up previously created instances and mounts a new component', (done) => {
            if (hgc) {
                hgc.unmount();
                hgc.detach();
            }

            if (div) {
                global.document.body.removeChild(div);
            }

            div = global.document.createElement('div');
            global.document.body.appendChild(div);

            div.setAttribute('style', 'height:800px; width:800px');
            div.setAttribute('id', 'single-view');
            hgc = mount(<HiGlassComponent 
                            options={{bounded: true}}
                            viewConfig={twoViewConfig}
                        />, 
                {attachTo: div});

            setTimeout(done, pageLoadTime);
        });

        it ("Ensures that the custom color map loads properly", (done) => {
            hgc.instance().tiledPlots['aa'].handleConfigureTrack(
                twoViewConfig.views[0].tracks.center[0].contents[0],
                HeatmapOptions);

            setTimeout(done, shortLoadTime);
        });
    });

    describe("Close view tests", () => {
        it ('Cleans up previously created instances and mounts a new component', (done) => {
            if (hgc) {
                hgc.unmount();
                hgc.detach();
            }

            if (div) {
                global.document.body.removeChild(div);
            }

            div = global.document.createElement('div');
            global.document.body.appendChild(div);

            div.setAttribute('style', 'height:800px; width:800px');
            div.setAttribute('id', 'single-view');
            hgc = mount(<HiGlassComponent 
                            options={{bounded: true}}
                            viewConfig={twoViewConfig}
                        />, 
                {attachTo: div});

            setTimeout(done, pageLoadTime);
        });

        it ("Ensures that when a view is closed, the PIXI graphics are removed", (done) => {
            hgc.instance().handleCloseView('view2');

            // console.log('hgc.instance:', hgc.instance().pixiStage.children);

            // since we removed one of the children, there should be only one left
            expect(hgc.instance().pixiStage.children.length).to.eql(1);

            setTimeout(done, shortLoadTime);
        });


    });
    
    describe("Multiple track addition", () => {
        let atm = null;

        it ('Cleans up previously created instances and mounts a new component', (done) => {
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
                          options={{bounded: false}}
                          viewConfig={oneViewConfig}
                        />, 
                {attachTo: div});

            setTimeout(done, pageLoadTime);
        });

        it ("should open the AddTrackModal", (done) => {
            // this was to test an example from the higlass-website demo page
            // where the issue was that the genome position search box was being
            // styled with a margin-bottom of 10px, fixed by setting the style of
            // genome-position-search to specify margin-bottom app/styles/GenomePositionSearchBox.css
            let tiledPlot = hgc.instance().tiledPlots['aa'];
            tiledPlot.handleAddTrack('top');

            hgc.update();

            atm = tiledPlot.addTrackModal;
            const inputField = ReactDOM.findDOMNode(atm.tilesetFinder.searchBox);

            // make sure the input field is equal to the document's active element
            // e.g. that it has focus
            expect(inputField).to.be.eql(document.activeElement);

            setTimeout(done, shortLoadTime);
        });

        it ("should select one plot type and double click", (done) => {
            let tilesetFinder = atm.tilesetFinder;
            tilesetFinder.handleSelectedOptions(["http://test.higlass.io/api/v1/CQMd6V_cRw6iCI_-Unl3PQ"]);
            hgc.update();

            tilesetFinder.props.onDoubleClick(tilesetFinder.state.options["http://test.higlass.io/api/v1/CQMd6V_cRw6iCI_-Unl3PQ"]);

            setTimeout(done, shortLoadTime);
        });

        it ("should reopen the AddTrackModal", (done) => {
            // open up the add track dialog for the next tests
            let tiledPlot = hgc.instance().tiledPlots['aa'];
            tiledPlot.handleAddTrack('top');
            hgc.update()
            atm = tiledPlot.addTrackModal;
            setTimeout(done, shortLoadTime);
        });

        it ("should select two different plot types", (done) => {
            let tilesetFinder = atm.tilesetFinder;

            tilesetFinder.handleSelectedOptions(["http://test.higlass.io/api/v1/TO3D5uHjSt6pyDPEpc1hpA", "http://test.higlass.io/api/v1/Nn8aA4qbTnmaa-oGGbuE-A"]);
        
            hgc.update();

            setTimeout(done, shortLoadTime);
        });

        it ("should add these plot types", (done) => {
            atm.handleSubmit();

            let tiledPlot = hgc.instance().tiledPlots['aa'];
            tiledPlot.handleAddTrack('top');

            hgc.update();

            atm = tiledPlot.addTrackModal;

            setTimeout(done, shortLoadTime);
        });

        it ("should select a few different tracks and check for the plot type selection", (done) => {
            let tilesetFinder = atm.tilesetFinder;

            tilesetFinder.handleSelectedOptions(["http://test.higlass.io/api/v1/CQMd6V_cRw6iCI_-Unl3PQ",
                "http://test.higlass.io/api/v1/GUm5aBiLRCyz2PsBea7Yzg"]);
        
            hgc.update();

            let ptc = atm.plotTypeChooser;

            expect(ptc.availableTrackTypes.length).to.eql(0);

            tilesetFinder.handleSelectedOptions(["http://test.higlass.io/api/v1/NNlxhMSCSnCaukAtdoKNXw",
                "http://test.higlass.io/api/v1/GGKJ59R-RsKtwgIgFohOhA"]);
        
            hgc.update();

            ptc = atm.plotTypeChooser;

            // should just have the horizontal-heatmap track type
            expect(ptc.availableTrackTypes.length).to.eql(1);

            done();
        });

        it ("should add the selected tracks", (done) => {
            //atm.unmount();
            atm.handleSubmit();
            //hgc.update();
            let viewConf = JSON.parse(hgc.instance().getViewsAsString());
           
            expect(viewConf.views[0].tracks['top'].length).to.eql(6);
            
            hgc.update();

            done();
        });

    });

    describe("Three views and linking", () => {
        it ('Cleans up previously created instances and mounts a new component', (done) => {
            if (hgc) {
                hgc.unmount();
                hgc.detach();
            }

            if (div) {
                global.document.body.removeChild(div);
            }


            div = global.document.createElement('div');
            global.document.body.appendChild(div);

            div.setAttribute('style', 'height:400px; width:800px;background-color: lightgreen');
            div.setAttribute('id', 'simple-hg-component');

            hgc = mount(<HiGlassComponent 
                          options={{bounded: true}}
                          viewConfig={threeViews}
                        />, 
                {attachTo: div});

            setTimeout(done, pageLoadTime);
        });

        it ("Links two views and moves to the side", (done) => {
            hgc.instance().handleLocationLockChosen('aa', 'bb');
            hgc.instance().handleZoomLockChosen('aa', 'bb');

            hgc.instance().tiledPlots['aa'].trackRenderer.setCenter(
                    1799508622.8021536, 1801234331.7949603, 17952.610495328903);
            setTimeout(done, shortLoadTime);
        });

        it ("Checks to make sure that the two views have moved to the same place", done => {
            let aaXScale = hgc.instance().xScales['aa'];
            let aaYScale = hgc.instance().yScales['aa'];

            let bbXScale = hgc.instance().xScales['bb'];
            let bbYScale = hgc.instance().yScales['bb'];

            let [aaCenterX, aaCenterY, aaK] = scalesCenterAndK(aaXScale, aaYScale);
            let [bbCenterX, bbCenterY, bbK] = scalesCenterAndK(bbXScale, bbYScale);

            expect(aaCenterX - bbCenterX).to.be.below(0.001);
            expect(aaCenterY - bbCenterY).to.be.below(0.001);

            done();
        });

        it ("Links the third view", done => {
            hgc.instance().handleLocationYanked('cc', 'aa');
            hgc.instance().handleZoomYanked('cc', 'aa');

            hgc.instance().handleLocationLockChosen('bb', 'cc');
            hgc.instance().handleZoomLockChosen('bb', 'cc');

            hgc.instance().tiledPlots['aa'].trackRenderer.setCenter(
                    1799509622.8021536, 1801244331.7949603, 17952.610495328903);

            setTimeout(done, shortLoadTime);
        });

        it ("Makes sure that the third view moved", done => {
            let aaXScale = hgc.instance().xScales['aa'];
            let aaYScale = hgc.instance().yScales['aa'];

            let ccXScale = hgc.instance().xScales['cc'];
            let ccYScale = hgc.instance().yScales['cc'];

            let [aaCenterX, aaCenterY, aaK] = scalesCenterAndK(aaXScale, aaYScale);
            let [ccCenterX, ccCenterY, ccK] = scalesCenterAndK(ccXScale, ccYScale);

            expect(aaCenterX - ccCenterX).to.be.below(0.001);
            expect(aaCenterY - ccCenterY).to.be.below(0.001);


            setTimeout(done, shortLoadTime);
        });
    });

    describe("AddTrackModal", () => {
        it ('Cleans up previously created instances and mounts a new component', (done) => {
            if (hgc) {
                hgc.unmount();
                hgc.detach();
            }

            if (div) {
                global.document.body.removeChild(div);
            }

            div = global.document.createElement('div');
            global.document.body.appendChild(div);

            div.setAttribute('style', 'height:400px; width:800px;background-color: lightgreen');
            div.setAttribute('id', 'simple-hg-component');

            hgc = mount(<HiGlassComponent 
                          options={{bounded: true}}
                          viewConfig={oneViewConfig}
                        />, 
                {attachTo: div});

            setTimeout(done, pageLoadTime);
        });

        it ("has the focus in the searchbar when adding a new track", (done) => {
            let tiledPlot = hgc.instance().tiledPlots['aa'];
            tiledPlot.handleAddTrack('top');

            hgc.update();

            const inputField = ReactDOM.findDOMNode(tiledPlot.addTrackModal.tilesetFinder.searchBox);

            // make sure the input field is equal to the document's active element
            // e.g. that it has focus
            expect(inputField).to.be.eql(document.activeElement);

            setTimeout(done, shortLoadTime);
        });
    });


    let hg19Text = '';
    let mm9Text = '';

    
    describe("Track addition and removal", () => {
        it ('Cleans up previously created instances and mounts a new component', (done) => {
            if (hgc) {
                hgc.unmount();
                hgc.detach();
            }

            if (div) {
                global.document.body.removeChild(div);
            }

            div = global.document.createElement('div');
            global.document.body.appendChild(div);

            div.setAttribute('style', 'height:800px; width:800px;background-color: lightgreen');
            div.setAttribute('id', 'simple-hg-component');

            hgc = mount(<HiGlassComponent 
                            options={{bounded: true}}
                            viewConfig={fritzBug1}
                          />, 
                {attachTo: div});

            setTimeout(done, pageLoadTime);
        });

        it ("should load the initial config", (done) => {
            hgc.setProps({options: { bounded: true}, viewConfig: fritzBug2});

            setTimeout(done, shortLoadTime);
        });

        it ("Should ensure that the viewconfig's width equals the previously set one", (done) => {
            expect(hgc.instance().state.views['a_'].layout.w).to.eql(12);
            expect(hgc.instance().state.views['a_'].layout.h).to.eql(6);

            setTimeout(done, shortLoadTime);
        });
    });

    describe("Window resizing", () => {
        let vpUid = null;
        let vp2DUid = null;

        it ('Cleans up previously created instances and mounts a new component', (done) => {
            if (hgc) {
                hgc.unmount();
                hgc.detach();
            }

            if (div) {
                global.document.body.removeChild(div);
            }

            div = global.document.createElement('div');
            global.document.body.appendChild(div);

            div.setAttribute('style', 'width:300px; height: 400px; background-color: lightgreen');
            div.setAttribute('id', 'simple-hg-component');

            let newViewConf = JSON.parse(JSON.stringify(project1D));

            let center1 = JSON.parse(JSON.stringify(heatmapTrack))
            let center2 = JSON.parse(JSON.stringify(heatmapTrack))

            newViewConf.views[0].tracks.center = [center1]
            newViewConf.views[1].tracks.center = [center2]

            newViewConf.views[0].layout.h = 10;
            newViewConf.views[1].layout.h = 10;

            hgc = mount(<HiGlassComponent 
                          options={{bounded: true}}
                          viewConfig={newViewConf}
                        />, 
                {attachTo: div});

            setTimeout(done, pageLoadTime);
        });

        it ('Sends a resize event to fit the current view into the window', (done) => {
            var resizeEvent = new Event('resize');

            window.dispatchEvent(resizeEvent);

            setTimeout(done, shortLoadTime);
        });

        it ('Resize the view', (done) => {
            div.setAttribute('style', 'width: 600px; height: 600px; background-color: lightgreen');
            var resizeEvent = new Event('resize');

            window.dispatchEvent(resizeEvent);

            setTimeout(done, shortLoadTime);
        });

        it ('Expect the the chosen rowHeight to be less than 24', (done) => {
            expect(hgc.instance().state.rowHeight).to.be.below(24);

            setTimeout(done, shortLoadTime);
        });
    });
    
    describe("1D viewport projection", () => {
        let vpUid = null;
        let vp2DUid = null;

        it ('Cleans up previously created instances and mounts a new component', (done) => {
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

            let newViewConf = JSON.parse(JSON.stringify(project1D));

            let center1 = JSON.parse(JSON.stringify(heatmapTrack))
            center1.height = 200;
            let center2 = JSON.parse(JSON.stringify(heatmapTrack))
            center2.height = 200;

            newViewConf.views[0].tracks.center = [center1]
            newViewConf.views[1].tracks.center = [center2]

            newViewConf.views[0].layout.h = 10;
            newViewConf.views[1].layout.h = 10;

            hgc = mount(<HiGlassComponent 
                          options={{bounded: false}}
                          viewConfig={newViewConf}
                        />, 
                {attachTo: div});

            setTimeout(done, pageLoadTime);
        });

        it ('Should lock the location without throwing an error', (done) => {
            hgc.instance().handleLocationLockChosen('aa', 'bb');
            // the viewconf contains a location lock, we need to ignore it
            //
            let track = getTrackObject(hgc, 'bb', 'line2');
            expect(track.labelText.text.indexOf('hg19')).to.eql(0);

            let overlayElements = document.getElementsByClassName('overlay');

            expect(overlayElements.length).to.eql(0);

            setTimeout(done, shortLoadTime);
        });

        it ('Should add a vertical viewport projection', (done) => {
            vpUid = hgc.instance().handleViewportProjected('bb', 'aa', 'vline1');
            //hgc.instance().tiledPlots['aa'].trackRenderer.setCenter(2540607259.217122,2541534691.921077,195.2581009864807);
            // move the viewport just a little bit
            let overlayElements = document.getElementsByClassName('overlay');

            // we should have created an overlay element
            expect(overlayElements.length).to.eql(1);

            setTimeout(done, shortLoadTime);
        })

        it ('Should project the viewport of view2 onto the gene annotations track', (done) => {
            vpUid = hgc.instance().handleViewportProjected('bb', 'aa', 'ga1');
            hgc.instance().tiledPlots['aa'].trackRenderer.setCenter(2540607259.217122,2541534691.921077,195.2581009864807);
            // move the viewport just a little bit
            //
            setTimeout(done, shortLoadTime);
        })

        it ('Should make sure that the track labels still contain the assembly' ,(done) => {
            let track = getTrackObject(hgc, 'bb', 'line2');
            expect(track.labelText.text.indexOf('hg19')).to.eql(0);
            setTimeout(done, shortLoadTime);
        });

        it ('Add a 2D vertical projection and move the lower track to different location', (done) => {
            let track = getTrackObject(hgc, 'bb', 'line2');

            hgc.instance().tiledPlots['bb'].trackRenderer.setCenter(2540607259.217122, 2541534691.921077, 87.50166702270508);
            vp2DUid = hgc.instance().handleViewportProjected('bb', 'aa', 'heatmap3');

            setTimeout(done, shortLoadTime);
        });

        it ("Resize the 1D projection", (done) => {

            let viewportTracker = getTrackObject(hgc, 'aa', vpUid);
            let viewport2DTracker = getTrackObject(hgc, 'aa', vp2DUid);

            // the 2D viewport tracker domains shouldn't change
            let preResizeYDomain = viewport2DTracker.viewportYDomain;
            viewportTracker.setDomainsCallback([2540588996.465288, 2540640947.3589344],
                                               [2541519510.3818445, 2541549873.460309]);

            let postResizeYDomain = JSON.parse(JSON.stringify(viewport2DTracker.viewportYDomain));

            expect(preResizeYDomain[1] - postResizeYDomain[1]).to.be.below(0.0001);
            expect(preResizeYDomain[1] - postResizeYDomain[1]).to.be.below(0.0001);

            setTimeout(done, shortLoadTime);
        });

    });

    describe("Starting with no genome position search box", () => {
        it ('Cleans up previously created instances and mounts a new component', (done) => {
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
                          options={{bounded: false}}
                          viewConfig={noGPSB}
                        />, 
                {attachTo: div});

            setTimeout(done, tileLoadTime);
            hgc.update();
        });

        it ("Makes the search box visible", (done) => {
            let assemblyPickButton = hgc.find('.assembly-pick-button');
            expect(assemblyPickButton.length).to.eql(0);

            hgc.instance().handleTogglePositionSearchBox('aa');
            hgc.update();

            assemblyPickButton = hgc.find('.assembly-pick-button');
            expect(assemblyPickButton.length).to.eql(1);

            setTimeout(done, tileLoadTime);
        });

        it ("Makes sure that the search box points to mm9", (done) => {
            expect(hgc.instance().genomePositionSearchBoxes['aa'].state.selectedAssembly).to.eql('mm9');

            done();
        });

        it ("Searches for the Clock gene", (done) => {
            // this gene previously did nothing when searching for it
            hgc.instance().genomePositionSearchBoxes['aa'].onAutocompleteChange({}, 'Clock');

            setTimeout(done, tileLoadTime);
        });

        it ("Clicks the search positions", (done) => {
            hgc.instance().genomePositionSearchBoxes['aa'].buttonClick();

            setTimeout(done, tileLoadTime + ZOOM_TRANSITION_DURATION + 2*shortLoadTime);
        });

        it ("Expects the view to have changed location", (done) => {
            let zoomTransform = hgc.instance().tiledPlots['aa'].trackRenderer.zoomTransform;

            expect(zoomTransform.k - 47).to.be.below(1);
            expect(zoomTransform.x - 2224932).to.be.below(1);

            done();
        });

        it ("Checks that autocomplete fetches some genes", (done) => {
            //hgc.instance().genomePositionSearchBoxes['aa'].onAutocompleteChange({}, "t");
            //new ReactWrapper(hgc.instance().genomePositionSearchBoxes['aa'].autocompleteMenu, true).simulate('change', { value: 't'});
            //new ReactWrapper(hgc.instance().genomePositionSearchBoxes['aa'], true).setState({value: 't'});
            hgc.instance().genomePositionSearchBoxes['aa'].onAutocompleteChange({}, 'T');
            hgc.update();

            setTimeout(done, tileLoadTime);
        });

        it ("Checks the selected genes", (done) => {
            // don't use the human autocomplete id
            expect(hgc.instance().genomePositionSearchBoxes['aa'].state.autocompleteId).to.not.eql('OHJakQICQD6gTD7skx4EWA')
            expect(hgc.instance().genomePositionSearchBoxes['aa'].state.genes[0].geneName).to.eql('Gt(ROSA)26Sor');

            setTimeout(done, shortLoadTime);
        });


        it ("Switch the selected genome to hg19", (done) => {
            hgc.instance().genomePositionSearchBoxes['aa'].handleAssemblySelect('hg19');
            hgc.update();

            setTimeout(done, shortLoadTime);
        });

        it ("Sets the text to TP53", (done) => {
            hgc.instance().genomePositionSearchBoxes['aa'].onAutocompleteChange({}, 'TP53');
            hgc.update();

            setTimeout(done, shortLoadTime);
        });

        it ("Clicks on the search button", (done) => {
            hgc.instance().genomePositionSearchBoxes['aa'].buttonClick();

            setTimeout(done, tileLoadTime + ZOOM_TRANSITION_DURATION + 2*shortLoadTime);
        });

        it ("Expects the view to have changed location", (done) => {
            let zoomTransform = hgc.instance().tiledPlots['aa'].trackRenderer.zoomTransform;

            expect(zoomTransform.k - 234).to.be.below(1);
            expect(zoomTransform.x + 7656469).to.be.below(1);

            done();
        });


        it ("Ensures that the autocomplete has changed", (done) => {
            hgc.instance().genomePositionSearchBoxes['aa'].onAutocompleteChange({}, '');
            expect(hgc.instance().genomePositionSearchBoxes['aa'].state.autocompleteId).to.eql('OHJakQICQD6gTD7skx4EWA')

            setTimeout(done, tileLoadTime);
        });

        it ("Ensure that newly loaded genes are from hg19", (done) => {
            expect(hgc.instance().genomePositionSearchBoxes['aa'].state.genes[0].geneName).to.eql('TP53');

            done();
        });

        it ("Switches back to mm9", (done) => {
            hgc.instance().genomePositionSearchBoxes['aa'].handleAssemblySelect('mm9');
            hgc.update();

            setTimeout(done, tileLoadTime);
        });

        it ("Mock type something", (done) => {
            hgc.instance().genomePositionSearchBoxes['aa'].onAutocompleteChange({}, '');

            setTimeout(done, tileLoadTime);
        });

        it ("Make sure it has mouse genes", (done) => {
            expect(hgc.instance().genomePositionSearchBoxes['aa'].state.genes[0].geneName).to.eql('Gt(ROSA)26Sor');

            done();
        });

        it ("Switches back to hg19", (done) => {
            hgc.instance().genomePositionSearchBoxes['aa'].handleAssemblySelect('hg19');
            hgc.update();

            setTimeout(done, tileLoadTime);
        });

        it ("Makes the search box invisible", (done) => {
            expect(hgc.instance().genomePositionSearchBoxes['aa'].state.selectedAssembly).to.eql('hg19');
            hgc.instance().handleTogglePositionSearchBox('aa');
            hgc.update();

            let assemblyPickButton = hgc.find('.assembly-pick-button');
            expect(assemblyPickButton.length).to.eql(0);

            setTimeout(done, shortLoadTime);
        });

        it ("Makes the search box visible again", (done) => {
            hgc.instance().handleTogglePositionSearchBox('aa');
            hgc.update();

            setTimeout(done, tileLoadTime);
        });

        it ("Ensures that selected assembly is hg19", (done) => {
            expect(hgc.instance().genomePositionSearchBoxes['aa'].state.selectedAssembly).to.eql('hg19');
            
            done();
        });

        it ("checks that the div hasn't grown too much", (done) => {
            expect(div.clientHeight).to.be.below(500);

            done();
        });

    });

    describe("Starting with an existing genome position search box", () => {
        it ('Cleans up previously created instances and mounts a new component', (done) => {
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
                          options={{bounded: false}}
                          viewConfig={onlyGPSB}
                        />, 
                {attachTo: div});

            setTimeout(done, tileLoadTime);
            hgc.update();
        });

        it ("Makes the search box invisible", (done) => {
            hgc.instance().handleTogglePositionSearchBox('aa');

            setTimeout(done, shortLoadTime);
        });

        it ("Makes the search box visible again", (done) => {
            hgc.instance().handleTogglePositionSearchBox('aa');

            setTimeout(done, shortLoadTime);
        });

        it ("Selects mm9", (done) => {

            let dropdownButton = hgc.find('.assembly-pick-button');
            hgc.instance().genomePositionSearchBoxes['aa'].handleAssemblySelect('mm9');

            setTimeout(done, tileLoadTime);
        });

        it ("Checks that mm9 was properly set and switches back to hg19", (done) => {
            hgc.update();
            let button = new ReactWrapper(hgc.instance().genomePositionSearchBoxes['aa'].assemblyPickButton, true);
            expect(button.props().title).to.be.eql('mm9');

            hgc.instance().genomePositionSearchBoxes['aa'].handleAssemblySelect('hg19');

            setTimeout(done, tileLoadTime);
        });

        it ("Checks that hg19 was properly", (done) => {
            hgc.update();
            let button = new ReactWrapper(hgc.instance().genomePositionSearchBoxes['aa'].assemblyPickButton, true);
            expect(button.props().title).to.be.eql('hg19');

            setTimeout(done, shortLoadTime);
        });
    });
    

    describe("Single view", () => {
        it ('Cleans up previously created instances and mounts a new component', (done) => {
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
                          options={{bounded: false}}
                          viewConfig={oneViewConfig}
                        />, 
                {attachTo: div});

            setTimeout(done, pageLoadTime);
        });

        it ("should load the initial config", (done) => {
            setTimeout(done, shortLoadTime);
        });

        it ("Changes the axis to inner right", (done) => {
            let newOptions = {
                "axisPositionHorizontal": "right",
            };

            hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

            let track = getTrackObject(hgc, 'aa', 'line1');
            let pAxis = track.axis.pAxis;

            // we want the axis labels to be to the left of the end of the track
            expect(pAxis.position.x).to.be.above(track.position[0]);
            expect(pAxis.children[0].x).to.be.below(0);

            setTimeout(done, shortLoadTime);
        });

        it ("Changes the axis to outside right", (done) => {
            let newOptions = {
                "axisPositionHorizontal": "outsideRight",
            };

            hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

            let track = getTrackObject(hgc, 'aa', 'line1');
            let pAxis = track.axis.pAxis;


            // we want the axis labels to be to the left of the end of the track
            expect(pAxis.position.x).to.be.above(track.position[0]);
            expect(pAxis.children[0].x).to.be.above(0);

            setTimeout(done, shortLoadTime);
        });

        it ("Changes the axis to outside left", (done) => {
            let newOptions = {
                "axisPositionHorizontal": "outsideLeft",
            };

            hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

            let track = getTrackObject(hgc, 'aa', 'line1');
            let pAxis = track.axis.pAxis;

            // we want the axis labels to be to the left of the end of the track
            expect(pAxis.position.x).to.be.eql(track.position[0]);
            expect(pAxis.children[0].x).to.be.below(0);

            setTimeout(done, shortLoadTime);
        });

        it ("Changes the axis to the left", (done) => {
            let newOptions = {
                "axisPositionHorizontal": "left",
            };

            hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

            let track = getTrackObject(hgc, 'aa', 'line1');
            let pAxis = track.axis.pAxis;

            // we want the axis labels to be to the left of the end of the track
            expect(pAxis.position.x).to.be.eql(track.position[0]);
            expect(pAxis.children[0].x).to.be.above(0);

            setTimeout(done, shortLoadTime);
        });

        it ("Changes the axis to the top", (done) => {
            let newOptions = {
                "axisPositionHorizontal": null,
                "axisPositionVertical": "top",
            };

            hgc.instance().handleTrackOptionsChanged('aa', 'vline1', newOptions);

            let track = getTrackObject(hgc, 'aa', 'vline1').originalTrack;
            let pAxis = track.axis.pAxis;

            // we want the axis labels to be to the left of the end of the track
            expect(pAxis.position.x).to.be.eql(track.position[0]);
            expect(pAxis.children[0].x).to.be.above(0);

            setTimeout(done, shortLoadTime);
        });

        it ("Changes the axis to the outside top", (done) => {
            let newOptions = {
                "axisPositionHorizontal": null,
                "axisPositionVertical": "outsideTop",
            };

            hgc.instance().handleTrackOptionsChanged('aa', 'vline1', newOptions);

            let track = getTrackObject(hgc, 'aa', 'vline1').originalTrack;
            let pAxis = track.axis.pAxis;

            // we want the axis labels to be to the left of the end of the track
            expect(pAxis.position.x).to.be.eql(track.position[0]);
            expect(pAxis.children[0].x).to.be.below(0);

            setTimeout(done, shortLoadTime);
        });

        it ("Changes the axis to the outside bottom", (done) => {
            let newOptions = {
                "axisPositionHorizontal": null,
                "axisPositionVertical": "outsideBottom",
            };

            hgc.instance().handleTrackOptionsChanged('aa', 'vline1', newOptions);

            let track = getTrackObject(hgc, 'aa', 'vline1').originalTrack;
            let pAxis = track.axis.pAxis;

            // we want the axis labels to be to the left of the end of the track
            expect(pAxis.position.x).to.be.above(track.position[0]);
            expect(pAxis.children[0].x).to.be.above(0);

            setTimeout(done, shortLoadTime);
        });

        it ("Changes the axis to the bottom", (done) => {
            let newOptions = {
                "axisPositionVertical": "bottom",
            };

            hgc.instance().handleTrackOptionsChanged('aa', 'vline1', newOptions);

            let track = getTrackObject(hgc, 'aa', 'vline1').originalTrack;
            let pAxis = track.axis.pAxis;

            // we want the axis labels to be to the left of the end of the track
            expect(pAxis.position.x).to.be.above(track.position[0]);
            expect(pAxis.children[0].x).to.be.below(0);

            setTimeout(done, shortLoadTime);
        });

    });


    describe("Track addition and removal", () => {
        it ('Cleans up previously created instances and mounts a new component', (done) => {
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
                          options={{bounded: false}}
                          viewConfig={testViewConfX2}
                        />, 
                {attachTo: div});

            setTimeout(done, pageLoadTime);
        });

        it ("should load the initial config", (done) => {
            // this was to test an example from the higlass-website demo page
            // where the issue was that the genome position search box was being
            // styled with a margin-bottom of 10px, fixed by setting the style of
            // genome-position-search to specify margin-bottom app/styles/GenomePositionSearchBox.css
           expect(hgc.instance().state.views['aa'].layout.h).to.be.eql(6);

            done();
        });

        it ("should change the opacity of the first text label to 20%", (done) => {
            let newOptions = JSON.parse(JSON.stringify(testViewConfX2.views[0].tracks.top[0].options))
            newOptions.labelTextOpacity = 0.2;

            hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);
            hgc.setState(hgc.instance().state);

            expect(getTrackObject(hgc, 'aa', 'line1').labelText.alpha).to.be.below(.21);

            setTimeout(done, shortLoadTime);
        });

        it ("should change the stroke width of the second line to 5", (done) => {
            let newOptions = JSON.parse(JSON.stringify(testViewConfX2.views[0].tracks.top[1].options))
            newOptions.lineStrokeWidth = 5;

            hgc.instance().handleTrackOptionsChanged('aa', 'line2', newOptions);
            hgc.setState(hgc.instance().state);

            expect(getTrackObject(hgc, 'aa', 'line1').labelText.alpha).to.be.below(.21);

            setTimeout(done, shortLoadTime);

        });

        it ("should do something else", (done) => {

            setTimeout(done, shortLoadTime);
        });
    });


    // wait a bit of time for the data to be loaded from the server
    describe("Track positioning", () => {
        it ('Cleans up previously created instances and mounts a new component', (done) => {
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
                          options={{bounded: false}}
                          viewConfig={horizontalDiagonalTrackViewConf}
                        />, 
                {attachTo: div});
            setTimeout(done, pageLoadTime);
        });

        it ("should add and resize a vertical heatmp", (done) => {
            hgc.instance().handleTrackAdded('aa', verticalHeatmapTrack, 'left');
            hgc.instance().state.views['aa'].tracks.left[0].width=100;

            hgc.setState(hgc.instance().state);
            hgc.instance().tiledPlots['aa'].measureSize();

            let track = getTrackObject(hgc, 'aa', 'vh1');

            expect(track.originalTrack.axis.track.flipText).to.eql(true);

            setTimeout(done, shortLoadTime);

        });


        it ("Should remove the vertical heatmap", (done) => {
            hgc.instance().handleCloseTrack('aa', 'vh1');
            hgc.setState(hgc.instance().state);
            hgc.instance().tiledPlots['aa'].measureSize();

            setTimeout(done, shortLoadTime);
        });

        it ("should add a heatmap", (done) => {
            // height defined in the testViewConf file, just the chromosome names
            // track
            expect(totalTrackPixelHeight(hgc.instance().state.views['aa'])).to.eql(57);

            hgc.instance().handleTrackAdded('aa', horizontalHeatmapTrack, 'top');

            hgc.setState(hgc.instance().state);

            // this should show the graphics, but it initially doesn't
            setTimeout(done, tileLoadTime);
        });

        it ("should change the opacity of the label", (done) => {
            hgc.instance().state.views['aa'].tracks.top[0].options.labelBackgroundOpacity = 0.5;

            hgc.setState(hgc.instance().state);
            let horizontalHeatmap = getTrackObject(hgc, 'aa', 'hh1');

            expect(horizontalHeatmap.options.labelBackgroundOpacity).to.eql(0.5);

            setTimeout(done, tileLoadTime);
        });

        it ("should have a horizontal heatmap scale", (done) => {
            let horizontalHeatmap = getTrackObject(hgc, 'aa', 'hh1');

            let svg = horizontalHeatmap.exportColorBarSVG();
            let rect = svg.getElementsByClassName('color-rect')[0];

            //let svgText = new XMLSerializer().serializeToString(svg);

            done();
        });

        it ("should add a large horizontal heatmap", (done) => {
            // handleTrackAdded automatically sets the height
            expect(hgc.instance().state.views['aa'].layout.h).to.eql(5);
            hgc.instance().handleTrackAdded('aa', largeHorizontalHeatmapTrack, 'top');

            hgc.setState(hgc.instance().state);

            setTimeout(done, tileLoadTime);
        });


        it ("should make sure that the new layout has expanded to encompass the new track", () => {
            //hgc.instance().render();
            expect(hgc.instance().state.views['aa'].layout.h).to.be.above(5);

        });

        it ("should add a few more horizontal tracks", (done) => {
            let numNewTracks = 5;
            for (let i = 0; i < numNewTracks; i++) {
                let newTrackJson = JSON.parse(JSON.stringify(largeHorizontalHeatmapTrack));
                newTrackJson.uid = slugid.nice();
                hgc.setState(hgc.instance().state);

                hgc.instance().handleTrackAdded('aa', newTrackJson, 'top');
            }

            hgc.setState(hgc.instance().state);

            setTimeout(done, tileLoadTime);
        });

        it ("updates the view and deletes some tracks", (done) => {
            //hgc.update();
            let trackRendererHeight = hgc.instance().tiledPlots['aa'].trackRenderer.currentProps.height;

            expect(trackRendererHeight).to.be.below(420); //should actually be 417

            let numToDelete = 3;
            let toDeleteUids = [];
            for (let i = 0; i < numToDelete; i++) {
                let trackUid = hgc.instance().state.views['aa'].tracks.top[i].uid;
                toDeleteUids.push(trackUid);
            }

            for (let uid of toDeleteUids) {
                hgc.instance().handleCloseTrack('aa', uid);
            }

            hgc.setState(hgc.instance().state);

            setTimeout(done, tileLoadTime)
        });

        it ("updates the view", () => {
            //hgc.update();
            let trackRendererHeight = hgc.instance().tiledPlots['aa'].trackRenderer.currentProps.height;

            expect(trackRendererHeight).to.be.below(400); //because we deleted some tracks
        });

        it ("Adds a center heatmap track", (done) => {
            hgc.instance().handleTrackAdded('aa', heatmapTrack, 'center');

            hgc.setState(hgc.instance().state);
            hgc.instance().tiledPlots['aa'].measureSize();
            
            //setTimeout(done, tileLoadTime);
            done();
        });

        it ("Checks to make sure the newly added heatmap was large enough and deletes a track", (done) => {
            let prevTrackRendererHeight = hgc.instance().tiledPlots['aa'].trackRenderer.currentProps.height;
            let prevTotalHeight = hgc.instance().calculateViewDimensions(hgc.instance().state.views['aa']).totalHeight;

            let newView = hgc.instance().handleCloseTrack('aa',  'hcl')['aa'];
            hgc.setState(hgc.instance().state);
            //hgc.instance().tiledPlots['aa'].measureSize();

            //let nextTrackRendererHeight = hgc.instance().tiledPlots['aa'].trackRenderer.currentProps.height;
            let nextTotalHeight = hgc.instance().calculateViewDimensions(newView).totalHeight;

                //expect(nextTrackRendererHeight).to.be.equal(prevTrackRendererHeight - 57);
            expect(nextTotalHeight).to.be.below(prevTotalHeight);
            
            setTimeout(done, shortLoadTime);
            //done();
        });

        it ("Should resize the center track", (done) => {
            let view = hgc.instance().state.views['aa'];
            view.layout.h += 2;

            hgc.setState(hgc.instance().state);
            hgc.instance().tiledPlots['aa'].measureSize();

            setTimeout(done, shortLoadTime);
            //done();
        });

        it ("Should add a bottom track and have the new height", (done) => {
            expect(hgc.instance().tiledPlots['aa'].trackRenderer.getTrackObject('heatmap3').dimensions[1]).to.be.above(140);

            let newTrack = JSON.parse(JSON.stringify(horizontalHeatmapTrack));
            newTrack.uid = 'xyx1';

            hgc.instance().handleTrackAdded('aa', newTrack, 'bottom');
            hgc.setState(hgc.instance().state);
            hgc.instance().tiledPlots['aa'].measureSize();

            // adding a new track should not make the previous one smaller
            expect(hgc.instance().tiledPlots['aa'].trackRenderer.getTrackObject('heatmap3').dimensions[1]).to.be.above(140);

            done();
        });

        it ("Should resize the center", (done) => {
            let view = hgc.instance().state.views['aa'];
            view.layout.h += 2;

            hgc.setState(hgc.instance().state);
            hgc.instance().tiledPlots['aa'].measureSize();

            setTimeout(done, shortLoadTime);

        });

        it ("Should delete the bottom track and not resize the center", (done) => {
            let prevSize = hgc.instance().tiledPlots['aa'].trackRenderer.getTrackObject('heatmap3').dimensions[1];

            hgc.instance().handleCloseTrack('aa', 'xyx1');
            hgc.setState(hgc.instance().state);
            hgc.instance().tiledPlots['aa'].measureSize();

            let nextSize = hgc.instance().tiledPlots['aa'].trackRenderer.getTrackObject('heatmap3').dimensions[1];

            //expect(nextSize).to.be.eql(prevSize);

            done();
        });
    });

    // wait a bit of time for the data to be loaded from the server
    describe("Value interval track tests", () => {
        it ('Cleans up previously created instances and mounts a new component', (done) => {
            if (hgc) {
                hgc.unmount();
                hgc.detach();
            }

            if (div) {
                global.document.body.removeChild(div);
            }

            div = global.document.createElement('div');
            global.document.body.appendChild(div);

            div.setAttribute('style', 'height:800px; width:800px');
            div.setAttribute('id', 'single-view');
            hgc = mount(<HiGlassComponent 
                            options={{bounded: true}}
                            viewConfig={twoViewConfig}
                        />, 
                {attachTo: div});

            setTimeout(done, pageLoadTime);
        });

        it ("doesn't export maxWidth or filetype", () => {
            let viewString = hgc.instance().getViewsAsString();

            //expect(viewString.indexOf('1d-value-interval')).to.be.above(0);
            expect(viewString.indexOf('maxWidth')).to.be.below(0);
            expect(viewString.indexOf('filetype')).to.be.below(0);
            expect(viewString.indexOf('binsPerDimension')).to.be.below(0);
        });


    });
    

    describe("Double view", () => {

        it ('Cleans up previously created instances and mounts a new component', (done) => {
            if (hgc) {
                hgc.unmount();
                hgc.detach();
            }

            if (div) {
                global.document.body.removeChild(div);
            }

            div = global.document.createElement('div');
            global.document.body.appendChild(div);

            div.setAttribute('style', 'height:800px; width:800px');
            div.setAttribute('id', 'single-view');
            hgc = mount(<HiGlassComponent 
                          options={{bounded: true}}
                          viewConfig={twoViewConfig}
                        />, 
                {attachTo: div});

            setTimeout(done, pageLoadTime);
        });

        it ('changes the colorbar color when the heatmap colormap is changed', () => {
            hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);
            let newOptions = {
                  "colorRange": [
                    "white",
                    "black"
                  ],
                };

            hgc.instance().handleTrackOptionsChanged('aa', 'heatmap1', newOptions);

            let svg = getTrackObject(hgc, 'aa', 'heatmap1').exportSVG()[0];
            //hgc.instance().handleExportSVG();
            
            // how do we test for what's drawn in Pixi?'
            
            let oldOptions = {
                  "colorRange": [
                    "white",
                    "rgba(245,166,35,1.0)",
                    "rgba(208,2,27,1.0)",
                    "black"
                  ]
            }

            hgc.instance().handleTrackOptionsChanged('aa', 'heatmap1', oldOptions);

        });

        it ('switches between log and linear scales', () => {
            let newOptions = {
              "labelColor": "red",
              "labelPosition": "hidden",
              "axisPositionHorizontal": "right",
              "lineStrokeColor": "blue",
              "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
              "valueScaling": "linear"
            };

            expect(getTrackObject(hgc, 'aa', 'line1').options.valueScaling).to.eql('log');
            hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);
            expect(getTrackObject(hgc, 'aa', 'line1').options.valueScaling).to.eql('linear');

            newOptions.valueScaling = 'log';
            hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

            //hgc.update();
        });

        it ('exports SVG', () => {
            let svg = hgc.instance().createSVG();
            let svgText = new XMLSerializer().serializeToString(svg);

            //hgc.instance().handleExportSVG();

            // Make sure we have an axis that is offset from the origin
            //expect(svgText.indexOf('id="axis" transform="translate(390, 68)"')).to.be.above(0);

            // make sure that we have this color in the colorbar (this is part of the custard
            // color map)
            expect(svgText.indexOf('rgb(231, 104, 32)')).to.be.above(0);

            // make sure that this color, which is part of the afmhot colormap is not exported
            expect(svgText.indexOf('rgb(171, 43, 0)')).to.be.below(0);

            
            let tdo = hgc.instance().tiledPlots['aa'].trackRenderer.trackDefObjects;

            let line1 = hgc.instance().tiledPlots['aa'].trackRenderer.trackDefObjects['line1'].trackObject;

            let axis = line1.axis.exportAxisRightSVG(line1.valueScale, line1.dimensions[1]);
            let axisText = new XMLSerializer().serializeToString(axis);

            //hgc.instance().handleExportSVG();

            //let axis = svg.getElementById('axis');
            // make sure we have a tick mark for 200000
            expect(axisText.indexOf('1e+5')).to.be.above(0);
        })

        it ('has a colorbar', () => {
            let heatmap = hgc.instance().tiledPlots['aa'].trackRenderer
                .trackDefObjects['c1'].trackObject.createdTracks['heatmap1'];
            expect(heatmap.pColorbarArea.x).to.be.below(heatmap.dimensions[0] / 2);

            // make sure the labels are drawn on the outside
            expect(heatmap.axis.pAxis.getBounds().x).to.be.below(heatmap.pColorbar.getBounds().x);
            //hgc.instance().handleExportSVG(); 
        });

        it ("locks the scales and recenters the page", (done) => {
            hgc.instance().handleValueScaleLocked('aa', 'heatmap1', 'view2', 'heatmap2');
            let track1 = hgc.instance().tiledPlots['aa'].trackRenderer.getTrackObject('heatmap1');
            let track2 = hgc.instance().tiledPlots['view2'].trackRenderer.getTrackObject('heatmap2');

            // zoom out a little bit
            hgc.instance().tiledPlots['aa'].trackRenderer.setCenter(1799432348.8692136, 1802017603.5768778, 28874.21283197403);
            
            setTimeout(() => done(), tileLoadTime);
        });


        it ('ensures that the new track domains are equal and unlocks the scales', (done) => {
            let track1 = hgc.instance().tiledPlots['aa'].trackRenderer.getTrackObject('heatmap1');
            let track2 = hgc.instance().tiledPlots['view2'].trackRenderer.getTrackObject('heatmap2');

            let domain1 = track1.valueScale.domain();
            let domain2 = track2.valueScale.domain();

            expect(domain1[1]).to.eql(domain2[1]);

            hgc.instance().handleUnlockValueScale('aa', 'heatmap1');

            //unlock the scales and zoom out
            hgc.instance().tiledPlots['aa'].trackRenderer.setCenter(1799432348.8692136, 1802017603.5768778, 2887.21283197403);
            setTimeout(() => done(), tileLoadTime);
        });

        it ('ensure that new domains are unequal and locks the combined tracks', (done) => {
            let track1 = hgc.instance().tiledPlots['aa'].trackRenderer.getTrackObject('heatmap1');
            let track2 = hgc.instance().tiledPlots['view2'].trackRenderer.getTrackObject('heatmap2');

            let domain1 = track1.valueScale.domain();
            let domain2 = track2.valueScale.domain();

            expect(domain1[1]).to.not.eql(domain2[1]);

            hgc.instance().handleValueScaleLocked('aa', 'c1', 'view2', 'c2');
            hgc.instance().handleValueScaleLocked('aa', 'line1', 'view2', 'line2');

            // lock the scales of two combined views
            hgc.instance().tiledPlots['aa'].trackRenderer.setCenter(2268041199.8615317, 2267986087.2543955, 15.803061962127686);
            setTimeout(() => done(), tileLoadTime);
        });

        it ('ensures that the new track domains are equal and unlock the combined tracks', (done) => {
            let track1 = hgc.instance().tiledPlots['aa'].trackRenderer.getTrackObject('heatmap1');
            let track2 = hgc.instance().tiledPlots['view2'].trackRenderer.getTrackObject('heatmap2');

            let domain1 = track1.valueScale.domain();
            let domain2 = track2.valueScale.domain();

            expect(domain1[1]).to.be.above(1000);
            expect(domain1[1]).to.eql(domain2[1]);
            done();
        });

        it ('ensures that the lines have the same valueScale', (done) => {
            let track1 = hgc.instance().tiledPlots['aa'].trackRenderer.getTrackObject('line1');
            let track2 = hgc.instance().tiledPlots['view2'].trackRenderer.getTrackObject('line2');

            let domain1 = track1.valueScale.domain();
            let domain2 = track2.valueScale.domain();

            expect(domain1[1]).to.eql(domain2[1]);

            done();
        });

        it ("zooms out", (done) => {
            hgc.instance().tiledPlots['aa'].trackRenderer.setCenter(2268233532.6257076, 2268099618.396191, 1710.4168190956116);
            setTimeout(() => done(), tileLoadTime);
        });

        it ("ensures that the domain changed", (done) => {
            let track1 = hgc.instance().tiledPlots['aa'].trackRenderer.getTrackObject('heatmap1');
            let track2 = hgc.instance().tiledPlots['view2'].trackRenderer.getTrackObject('heatmap2');

            let domain1 = track1.valueScale.domain();
            let domain2 = track2.valueScale.domain();

            expect(domain1[1]).to.be.below(1);
            expect(domain1[1]).to.eql(domain2[1]);

            done();
        });

        it ('Unlocks the scales and moves to a different location', (done) => {
            hgc.instance().handleUnlockValueScale('aa', 'c1');

            //unlock the scales and zoom out
            hgc.instance().tiledPlots['aa'].trackRenderer.setCenter(1799432348.8692136, 1802017603.5768778, 2887.21283197403);
            setTimeout(() => done(), tileLoadTime);
        });

        it ('ensures that the new track domains are not equal', (done) => {
            let track1 = hgc.instance().tiledPlots['aa'].trackRenderer.getTrackObject('heatmap1');
            let track2 = hgc.instance().tiledPlots['view2'].trackRenderer.getTrackObject('heatmap2');

            let domain1 = track1.valueScale.domain();
            let domain2 = track2.valueScale.domain();

            expect(domain1[1]).to.not.eql(domain2[1]);

            //hgc.instance().handleUnlockValueScale('aa', 'heatmap1');

            //unlock the scales and zoom out
            //hgc.instance().tiledPlots['aa'].trackRenderer.setCenter(1799432348.8692136, 1802017603.5768778, 2887.21283197403);
            //setTimeout(() => done(), tileLoadTime);

            done();
        });
        it ('Lock view scales ', (done) => {
            hgc.instance().handleZoomLockChosen('aa', 'view2');
            hgc.instance().handleLocationLockChosen('aa', 'view2');

            done();
        });

        it ("locks the value scales ", (done) => {
            // lock the value scales to ensure that removing the track doesn't 
            // lead to an error
            hgc.instance().handleValueScaleLocked('aa', 'c1', 'view2', 'heatmap2');

            done();
        });

        it ('Replaces and displays a new track', (done) => {
            hgc.instance().handleCloseTrack('view2', 'c2');
            hgc.instance().handleTrackAdded('view2', heatmapTrack, 'center');

            hgc.instance().tiledPlots['view2'].render();
            hgc.instance().tiledPlots['view2'].trackRenderer.setCenter(
                    1799508622.8021536, 1801234331.7949603, 17952.610495328903);

            hgc.instance().tiledPlots['view2']
                .trackRenderer.syncTrackObjects(
                        hgc.instance().tiledPlots['view2'].positionedTracks());

            //setTimeout(() => done(), 200);
            done();
        });

        it ("Checks to make sure that the tracks are no longer locked", (done) => {
            let uid = hgc.instance().combineViewAndTrackUid('aa', 'heatmap1');
            let lockGroupValues = dictValues(hgc.instance().valueScaleLocks[uid]);

            done();
        });

        it ('Replaces and displays a new track', (done) => {
            //hgc.instance().handleValueScaleLocked('aa', 'c1', 'view2', 'heatmap3');

            let track =  hgc.instance().tiledPlots['view2'].trackRenderer.getTrackObject('heatmap3')

            // make sure that the newly added track is rendered
            expect(track.pMain.position.x).to.be.above(404);
            expect(track.pMain.position.x).to.be.below(406);

            setTimeout(() => done(), tileLoadTime);
        });

        it ('Locks the scales again (after waiting for the previous tiles to load)', (done) => {
            hgc.instance().handleValueScaleLocked('aa', 'c1', 'view2', 'heatmap3');

            let track1 = hgc.instance().tiledPlots['aa'].trackRenderer.getTrackObject('heatmap1');
            let track2 = hgc.instance().tiledPlots['view2'].trackRenderer.getTrackObject('heatmap3');

            let domain1 = track1.valueScale.domain();
            let domain2 = track2.valueScale.domain();
            
            done();
        });

        it ("Adds a chromInfo track", (done) => {
            // this test was here to visually make sure that the HorizontalChromosomeAxis
            // was rendered after being drawn
            hgc.instance().handleTrackAdded('view2', chromInfoTrack, 'top');

            hgc.instance().tiledPlots['view2'].render();
            hgc.instance().tiledPlots['view2']
                .trackRenderer.syncTrackObjects(
                        hgc.instance().tiledPlots['view2'].positionedTracks());

            // make sure that the chromInfo is displayed
            setTimeout(() => done(), tileLoadTime);
        });

        it ("replaces a track", (done) => {
            done();
        });
    })
});
