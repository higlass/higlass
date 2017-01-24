import '../styles/HiGlassApp.css';
import React from 'react';
//import d3 from 'd3';
import ReactDOM from 'react-dom';
import slugid from 'slugid';
import {HiGlassComponent} from './HiGlassComponent.jsx';
import {HiGlassInput} from './HiGlassInput.jsx';
import {Button, Panel, FormGroup, ControlLabel, FormControl, SafeAnchor} from 'react-bootstrap';
import {usedServer, tracksInfo, tracksInfoByType} from './config.js';

export class HiGlassDemo extends React.Component {
    constructor(props) {
        super(props);

          this.views = {
              'editable': true,
              zoomFixed: false,
              exportViewUrl: "//" + usedServer + "/viewconfs/",
              'views': [{
              uid: "aa",
              initialXDomain: [1200000000,1210000000],
              initialYDomain: [0,3000000000],
              autocompleteSource: "//" + usedServer + '/suggest/?d=dd&',
              genomePositionSearchBoxVisible: true,
              chromInfoPath: "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
              'tracks': {
            'top': [
                /*
                {'uid': slugid.nice(), type:'top-axis'}
            ,
            */

                    {
                        'uid': slugid.nice(), 
                        type:'horizontal-gene-annotations',
                        height: 60,
                      tilesetUid: 'dd',
                      server: usedServer 
                    }
                      ,
            ],
            'left': [
                    {
                        'uid': slugid.nice(), 
                        type:'vertical-gene-annotations',
                        width: 60,
                      tilesetUid: 'dd',
                      server: usedServer 
                    }
            ],
            'center': [
                {   
                    uid: 'c1',
                    type: 'combined',
                    height: 200,
                    contents: 
                    [

                        { 
                            'uid': 'hm1',
                           'server': usedServer ,
                          'tilesetUid': 'ma',
                          'type': 'heatmap'
                        },
                        {
                              'uid': slugid.nice(),
                              type:'arrowhead-domains',
                              height: 60,
                            tilesetUid: 'f',
                            server: usedServer
                          }
                    ,

                        {
                              'uid': slugid.nice(),
                              type:'arrowhead-domains',
                              height: 60,
                            tilesetUid: 'i',
                            server: usedServer
                          }
                    ]
                }
            ]}
            ,
            layout: {x: 0, y: 0, w: 6, h: 10}

          }
          ,
            {
              uid: 'bb',
              initialXDomain: [20000000,300000000],
              initialYDomain: [20000000,300000000],
              'tracks': {
            'top': [
                {'uid': slugid.nice(), type:'top-axis'}
            ,

                    {'uid': slugid.nice(), 
                        type:'horizontal-1d-tiles',
                        height: 20,
                      tilesetUid: 'bb',
                      server: usedServer }
                      ,
                    {'uid': slugid.nice(), 
                        type:'horizontal-line',
                        height: 20,
                      tilesetUid: 'bb',
                      server: usedServer }
                    /*
                      ,
                {'uid': slugid.nice(),
                 type: 'combined',
                 height: 100,
                 contents:
                     [
                    {'uid': slugid.nice(), 
                        type:'horizontal-line',
                        height: 30,
                        width: 20,
                      tilesetUid: 'bb',
                      server: usedServer }
                      ,
                    {'uid': slugid.nice(),
                        type: 'top-stacked-interval',
                        height: 30,
                        tilesetUid: 'cc',
                        server:  usedServer 
                    }
                    ,
                    {'uid': slugid.nice(), 
                        type:'horizontal-1d-tiles',
                        height: 30,
                      tilesetUid: 'cc',
                      server: usedServer }

                     ]
                }
                      */
            ],
            'left': [
                {'uid': slugid.nice(), type:'left-axis', width: 80}
                /*
                ,
                {'uid': slugid.nice(),
                 type: 'combined',
                 width: 60,
                 contents:
                     [
                         /*
                    {'uid': slugid.nice(),
                        type: 'left-stacked-interval',
                        height: 30,
                        tilesetUid: 'cc',
                        server:  usedServer 
                    }
                    ,
                    {'uid': slugid.nice(), 
                        type:'vertical-line',
                        height: 30,
                        width: 20,
                      tilesetUid: 'bb',
                      server: usedServer }
                     ]
                }
                      ,
                ,
                {'uid': slugid.nice(), 
                    type:'vertical-1d-tiles',
                  tilesetUid: '5aa265c9-2005-4ffe-9d1c-fe59a6d0e768',
                  server: '52.45.229.11'}
                  */
            ],
            'center': [
                {   
                    uid: slugid.nice(),
                    type: 'combined',
                    height: 200,
                    contents: 
                    [

                        { 'server': usedServer ,
                          'uid': slugid.nice(),
                          'tilesetUid': 'aa',
                          'type': 'heatmap'
                        }
                        ,
                        { 'server': usedServer ,
                          'uid': slugid.nice(),
                          'tilesetUid': 'aa',
                          'type': '2d-tiles'
                        }
                        ,
                        {
                            'type': 'viewport-projection-center',
                            uid: slugid.nice(),
                            'fromViewUid': 'aa'
                        }
                    ]
                }
            ]}
            ,
            layout: {x: 3, y: 0, w: 3, h: 10}

          }
          
          ]
          }

        this.views.views = [this.views.views[0]];

    }

    render() {
        /*
        let divStyle = {"paddingLeft": "20px",
                        "paddingRight": "20px"}
        */
       let divStyle = {};

        let toolbarStyle = {"position": "relative",
                       "top": "-1px"};
                    /*
                    <MultiViewEditContainer viewConfig={this.state.viewConfig}
                    handleEdit={this.handleViewEdit.bind(this)}
                    visible={this.state.inputOpen}
                        />
                        */

        return (
                <div style={divStyle}>

                <Panel 
                    className="higlass-display"
                    ref='displayPanel'
                >
                    <HiGlassComponent 
                        viewConfig={this.views} 
                    />

                </Panel>
                </div>
        );
    }
}

HiGlassApp.propTypes = {
    viewConfigString: React.PropTypes.string
}
