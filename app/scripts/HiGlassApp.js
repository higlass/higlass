import '../styles/HiGlassApp.css';
import React from 'react';
import ReactDOM from 'react-dom';
import {MultiViewContainer} from './MultiViewContainer.jsx';
import {HiGlassInput} from './HiGlassInput.jsx';
import {Button, Panel, FormGroup, ControlLabel, FormControl, SafeAnchor} from 'react-bootstrap';

export class HiGlassApp extends React.Component {
    constructor(props) {
        super(props);

        let oneWindow = `

  {
    "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
    "domain": [
      0,
      3000000000
    ],
    "viewStyle": {
      "float": "left",
      "padding": "5px",
      "width": "50%"
    },
    "tracks": [
        {
        "source": "//52.23.165.123:9872/hg19.1/Rao2014-GM12878-MboI-allreps-filtered.1kb.cool.reduced.genome.gz",
        "type": "top-diagonal-heatmap",
        "height": 200
      },
      {
        "source": "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
        "type": "top-chromosome-axis"
      },
      {
        "source": "//52.23.165.123:9872/hg19/refgene-tiles-plus",
        "type": "top-gene-labels",
        "height": 25
      },

      {
        "source": "//52.23.165.123:9872/hg19.1/wgEncodeSydhTfbsGm12878Pol2s2IggmusSig.bigWig.bedGraph.genome.sorted.gz",
        "type": "top-line",
        "height": 25
      }
    ]
  }
`
    this.defaultViewString = JSON.stringify([JSON.parse(oneWindow), JSON.parse(oneWindow)]);

    this.state = {
        //viewConfig : []

        viewConfig : JSON.parse(this.defaultViewString),
        inputOpen: false
    }

    }

    updateLinkedViews(viewConfig) {
        for (let i = 0; i < viewConfig.length; i++) {
            if (typeof viewConfig[i].zoomLock ==  'undefined')
                viewConfig[i].zoomDispatch = d3.dispatch('zoom', 'zoomend')
            else {
                let zoomLock = viewConfig[i].zoomLock;
                if (typeof viewConfig[zoomLock].zoomDispatch == 'undefined') {
                    console.log('ERROR: view requests zoom lock to another view with an undefined zoomDispatch:', zoomLock);
                }

                viewConfig[i].zoomDispatch = viewConfig[zoomLock].zoomDispatch;
            }
        }

    }

    handleNewConfig(configText) {
        let viewConfig = JSON.parse(configText);
        this.updateLinkedViews(viewConfig);

        this.setState(
         {
             viewConfig : viewConfig
         });

    };
        

    render() {
        let divStyle = {"paddingLeft": "20px",
                        "paddingRight": "20px"}

        let toolbarStyle = {"position": "relative",
                       "top": "-1px"};

        return (
                <div style={divStyle}>

                <Panel 
                    ref='displayPanel'
                    className="higlass-display"
                    >
                    <MultiViewContainer viewConfig={this.state.viewConfig}
                    />
                </Panel>
                <HiGlassInput currentConfig={this.defaultViewString} 
                        onNewConfig={this.handleNewConfig.bind(this)} 
                        />
                </div>
        );
    }
}

