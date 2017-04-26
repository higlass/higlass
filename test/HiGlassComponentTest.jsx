import { 
    mount, 
    render
} from 'enzyme';
import {
  scalesCenterAndK
} from '../app/scripts/utils.js';
import { expect } from 'chai';
import {scaleLinear} from 'd3-scale';
import React from 'react';
import ReactDOM from 'react-dom';
import {AddTrackModal} from '../app/scripts/AddTrackModal.jsx';
import {HiGlassComponent} from '../app/scripts/HiGlassComponent.jsx';

let chromInfoTrack = 
          {
            "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
            "type": "horizontal-chromosome-labels",
            "position": "top",
            "name": "Chromosome Labels (hg19)",
            "height": 30,
            "uid": "I1QUF22JQJuJ38j9PS4iqw",
            "options": {}
          };

let heatmapTrack = 
              {
                "filetype": "cooler",
                "name": "Dixon et al. (2015) H1_TB HindIII (allreps) 1kb",
                "server": "http://higlass.io/api/v1",
                "tilesetUid": "B2LevKBtRNiCMX372rRPLQ",
                "uid": "heatmap3",
                "type": "heatmap",
                "options": {
                  "labelPosition": "bottomRight",
                  "colorRange": [
                    "white",
                    "rgba(245,166,35,1.0)",
                    "rgba(208,2,27,1.0)",
                    "black"
                  ],
                  "maxZoom": null,
                  "colorbarLabelsPosition": "outside",
                  "colorbarPosition": "topLeft",
                  "name": "New tileset"
                },
                "width": 20,
                "height": 20,
                "maxWidth": 4194304000,
                "binsPerDimension": 256,
                "position": "center"
              };

let testViewConfig2 = 
{
  "editable": true,
  "zoomFixed": false,
  "trackSourceServers": [
    "http://higlass.io/api/v1"
  ],
  "exportViewUrl": "http://higlass.io/api/v1/viewconfs/",
  "views": [
    {
      "uid": "aa",
      "initialXDomain": [
        1796142508.3343146,
        1802874737.269993
      ],
      "initialYDomain": [
        1795888772.6557815,
        1806579890.9341388
      ],
      "autocompleteSource": "http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "genomePositionSearchBoxVisible": true,
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "tracks": {
        "top": [
          {
            "filetype": "hitile",
            "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "F2vbUeqhS86XkxuO1j2rPA",
            "type": "horizontal-line",
            "options": {
              "labelColor": "red",
              "labelPosition": "hidden",
              "axisPositionHorizontal": "right",
              "lineStrokeColor": "blue",
              "name": "wgEncodeSydhTfbsGm12878Rad21IggrabSig.hitile",
              "valueScaling": "log"
            },
            "width": 20,
            "height": 20,
            "maxWidth": 4294967296,
            "position": "top",
            "uid": "line1"
          }
        ],
        "left": [],
        "center": [
          {
            "uid": "c1",
            "type": "combined",
            "height": 200,
            "contents": [
              {
                "server": "http://higlass.io/api/v1",
                "tilesetUid": "CQMd6V_cRw6iCI_-Unl3PQ",
                "type": "heatmap",
                "position": "center",
                "options": {
                  "colorRange": [
                    "white",
                    "rgba(245,166,35,1.0)",
                    "rgba(208,2,27,1.0)",
                    "black"
                  ],
                  "colorbarPosition": "topLeft",
                  "colorbarOrientation": "vertical",
                  "colorbarLabelsPosition": "outside",
                  "maxZoom": null,
                  "labelPosition": "bottomRight",
                  "name": "Rao et al. (2014) GM12878 MboI (allreps) 1kb"
                },
                "uid": "heatmap1",
                "name": "Rao et al. (2014) GM12878 MboI (allreps) 1kb",
                "maxWidth": 4194304000,
                "binsPerDimension": 256
              },
              {
                "type": "2d-chromosome-grid",
                "local": true,
                "orientation": "2d",
                "name": "Chromosome Grid (hg19)",
                "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
                "thumbnail": null,
                "server": "",
                "tilesetUid": "TIlwFtqxTX-ndtM7Y9k1bw",
                "uid": "LUVqXXu2QYiO8XURIwyUyA",
                "options": {
                  "gridStrokeWidth": 1,
                  "gridStrokeColor": "grey"
                },
                "position": "center"
              }
            ],
            "position": "center",
            "options": {}
          }
        ],
        "right": [],
        "bottom": []
      },
      "layout": {
        "w": 6,
        "h": 12,
        "x": 0,
        "y": 0,
        "i": "aa",
        "moved": false,
        "static": false
      }
    },
    {
      "uid": "view2",
      "initialXDomain": [
        1796142508.3343008,
        1802874737.270007
      ],
      "initialYDomain": [
        1795888772.6557593,
        1806579890.9341605
      ],
      "autocompleteSource": "http://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&",
      "genomePositionSearchBoxVisible": true,
      "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
      "tracks": {
        "top": [
          {
            "filetype": "hitile",
            "name": "wgEncodeSydhTfbsGm12878Ctcfsc15914c20StdSig.hitile",
            "server": "http://higlass.io/api/v1",
            "tilesetUid": "b6qFe7fOSnaX-YkP2kzN1w",
            "uid": "line2",
            "type": "horizontal-line",
            "options": {
              "labelColor": "black",
              "labelPosition": "topLeft",
              "axisPositionHorizontal": "left",
              "lineStrokeColor": "blue",
              "valueScaling": "linear",
              "name": "wgEncodeSydhTfbsGm12878Ctcfsc15914c20StdSig.hitile"
            },
            "width": 20,
            "height": 20,
            "maxWidth": 4294967296,
            "position": "top"
          }
        ],
        "left": [],
        "center": [
          {
            "uid": "c2",
            "type": "combined",
            "contents": [
              {
                "filetype": "cooler",
                "name": "Dixon et al. (2015) H1_TB HindIII (allreps) 1kb",
                "server": "http://higlass.io/api/v1",
                "tilesetUid": "clU7yGb-S7eY4yNbdDlj9w",
                "uid": "heatmap2",
                "type": "heatmap",
                "options": {
                  "labelPosition": "bottomRight",
                  "colorRange": [
                    "white",
                    "rgba(245,166,35,1.0)",
                    "rgba(208,2,27,1.0)",
                    "black"
                  ],
                  "maxZoom": null,
                  "colorbarLabelsPosition": "outside",
                  "colorbarPosition": "topLeft",
                  "name": "Dixon et al. (2015) H1_TB HindIII (allreps) 1kb"
                },
                "width": 20,
                "height": 20,
                "maxWidth": 4194304000,
                "binsPerDimension": 256,
                "position": "center"
              }
            ],
            "position": "center",
            "options": {}
          }
        ],
        "right": [],
        "bottom": []
      },
      "layout": {
        "w": 6,
        "h": 12,
        "x": 6,
        "y": 0,
        "i": "view2",
        "moved": false,
        "static": false
      }
    }
  ],
  "zoomLocks": {
    "locksByViewUid": {
      "view2": "JAFSZPdmSWe72WgTnVDtbA",
      "aa": "JAFSZPdmSWe72WgTnVDtbA"
    },
    "locksDict": {
      "JAFSZPdmSWe72WgTnVDtbA": {
        "view2": [
          1812727561.5083356,
          1873757116.378131,
          475954.14177536964
        ],
        "aa": [
          1812727561.5083356,
          1873757116.378131,
          475954.14177536964
        ]
      }
    }
  },
  "locationLocks": {
    "locksByViewUid": {
      "view2": "fRq4SRH8TSyVveKqebWsxw",
      "aa": "fRq4SRH8TSyVveKqebWsxw"
    },
    "locksDict": {
      "fRq4SRH8TSyVveKqebWsxw": {
        "view2": [
          1812727561.5083356,
          1873757116.378131,
          475954.14177536964
        ],
        "aa": [
          1812727561.5083356,
          1873757116.378131,
          475954.14177536964
        ]
      }
    }
  }
}
const pageLoadTime = 1200;

function testAsync(done) {
    // Wait two seconds, then set the flag to true
    setTimeout(function () {
        //flag = true;

        // Invoke the special done callback
        done();
    }, pageLoadTime);
}

describe("Simple HiGlassComponent", () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    div.setAttribute('style', 'height:800px; width:800px');

    let hgc = mount(<HiGlassComponent 
                        options={{bounded: true}}
                        viewConfig={testViewConfig2}
                      />, 
            {attachTo: div});


    // wait a bit of time for the data to be loaded from the server

    describe("Single view", () => {
        beforeAll((done) => {
            testAsync(done);
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
            
            setTimeout(() => done(), 400);
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
            setTimeout(() => done(), 400);
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
            setTimeout(() => done(), 400);
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
            setTimeout(() => done(), 400);
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
            setTimeout(() => done(), 400);
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
            //setTimeout(() => done(), 400);

            done();
        });
        it ('Lock view scales ', (done) => {
            hgc.instance().handleZoomLockChosen('aa', 'view2');
            hgc.instance().handleLocationLockChosen('aa', 'view2');

            done();
        });

        it ('Replaces and displays a new track', (done) => {
            hgc.instance().handleCloseTrack('view2', 'heatmap2');
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

        it ('Replaces and displays a new track', (done) => {
            //hgc.instance().handleValueScaleLocked('aa', 'c1', 'view2', 'heatmap3');

            let track =  hgc.instance().tiledPlots['view2'].trackRenderer.getTrackObject('heatmap3')

            // make sure that the newly added track is rendered
            expect(track.pMain.position.x).to.be.above(404);
            expect(track.pMain.position.x).to.be.below(406);

            setTimeout(() => done(), 400);
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
            setTimeout(() => done(), 400);
        });
    })
});
