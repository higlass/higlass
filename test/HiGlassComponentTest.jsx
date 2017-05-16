import {
    LONG_DRAG_TIMEOUT
} from '../app/scripts/config.js';

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
import {
    chromInfoTrack,
    heatmapTrack,
    twoViewConfig,
    valueIntervalTrackViewConf,
    horizontalDiagonalTrackViewConf,
    horizontalHeatmapTrack,
    largeHorizontalHeatmapTrack,
    verticalHeatmapTrack,
    testViewConfX1,
    testViewConfX2
} from '../app/scripts/testViewConfs.js';

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
    let hgc = null, div = null;

    describe("Multiple track addition", () => {
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

        let hgc = mount(<HiGlassComponent 
                        options={{bounded: false}}
                        viewConfig={testViewConfX2}
                      />, 
            {attachTo: div});

        let atm = null;

        it ("should open the AddTrackModal", (done) => {
            // this was to test an example from the higlass-website demo page
            // where the issue was that the genome position search box was being
            // styled with a margin-bottom of 10px, fixed by setting the style of
            // genome-position-search to specify margin-bottom app/styles/GenomePositionSearchBox.css
            atm = mount(<AddTrackModal
                                host={null}
                                onCancel={() => null}
                                onTrackChosen={null}
                                position={null}
                                show={true}
                                trackSourceServers={["http://higlass.io/api/v1"]}
                              />, {attachTo:div});
            const inputField = ReactDOM.findDOMNode(atm.instance().tilesetFinder.searchBox);
            console.log('atm.find', atm.find('select'));

            // make sure the input field is equal to the document's active element
            // e.g. that it has focus
            expect(inputField).to.be.eql(document.activeElement);

            setTimeout(done, shortLoadTime);
        });

        it ("should select a few elements", (done) => {
            console.log('here:', atm.find('select'));
            let multiSelect = new ReactWrapper(atm.instance().tilesetFinder.multiSelect);

            multiSelect.simulate('change', {target: {value: ["http://higlass.io/api/v1/Hyc3TZevQVm3FcTAZShLQg", "http://higlass.io/api/v1/B2LevKBtRNiCMX372rRPLQ"]}});
            done();
        });

        it ("should unmount the AddTrackModal", (done) => {
            //atm.unmount();

            done();
        });
    });

    return;


    describe("Positioning a more complex layout", () => {
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

        let hgc = mount(<HiGlassComponent 
                        options={{bounded: false}}
                        viewConfig={testViewConfX2}
                      />, 
            {attachTo: div});

        it ("should load the initial config", (done) => {
            // this was to test an example from the higlass-website demo page
            // where the issue was that the genome position search box was being
            // styled with a margin-bottom of 10px, fixed by setting the style of
            // genome-position-search to specify margin-bottom app/styles/GenomePositionSearchBox.css
           expect(hgc.instance().state.views['aa'].layout.h).to.be.eql(6);

            done();
        });
    });

    describe("Positioning a more complex layout", () => {
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

        let hgc = mount(<HiGlassComponent 
                        options={{bounded: false}}
                        viewConfig={testViewConfX1}
                      />, 
            {attachTo: div});

        it ("should load the initial config", (done) => {
            // more than 9 because of the view header
           expect(hgc.instance().state.views['aa'].layout.h).to.be.above(9);

            setTimeout(done, shortLoadTime);
        });

    });


    // wait a bit of time for the data to be loaded from the server
    describe("Track positioning", () => {
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

        let hgc = mount(<HiGlassComponent 
                        options={{bounded: false}}
                        viewConfig={horizontalDiagonalTrackViewConf}
                      />, 
            {attachTo: div});

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

            expect(nextSize).to.be.eql(prevSize);

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

    describe("Single view", () => {

        /*
        beforeAll((done) => {
            testAsync(done);
        });
        */

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

            //let axis = svg.getElementById('axis');
            // make sure we have a tick mark for 200000
            expect(axisText.indexOf('1e+4')).to.be.above(0);
        })

        it ('has a colorbar', () => {
            let heatmap = hgc.instance().tiledPlots['aa'].trackRenderer
                .trackDefObjects['c1'].trackObject.createdTracks['heatmap1'];
            expect(heatmap.pColorbarArea.x).to.be.below(heatmap.dimensions[0] / 2);

            // make sure the labels are drawn on the outside
            expect(heatmap.axis.pAxis.getBounds().x).to.be.below(heatmap.pColorbar.getBounds().x);
            //hgc.instance().handleExportSVG(); 
        });

        it ("has the focus in the searchbar when adding a new track", () => {
            const atm = mount(<AddTrackModal
                                host={null}
                                onCancel={() => null}
                                onTrackChosen={null}
                                position={null}
                                show={true}
                                trackSourceServers={[]}
                              />);
            const inputField = ReactDOM.findDOMNode(atm.instance().tilesetFinder.searchBox);

            // make sure the input field is equal to the document's active element
            // e.g. that it has focus
            expect(inputField).to.be.eql(document.activeElement);
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
