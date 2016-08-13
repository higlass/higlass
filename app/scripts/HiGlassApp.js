import React from 'react';
import ReactDOM from 'react-dom';
import {MultiViewContainer} from './MultiViewContainer.jsx';
import {Button, Panel, FormGroup, ControlLabel, FormControl} from 'react-bootstrap';

export class HiGlassApp extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            //viewConfig : []

            viewConfig : JSON.parse(`
                                    [
  {
    "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
    "domain": [
      0,
      2500000000
    ],
    "viewStyle": {
      "float": "left",
      "margin": "5px",
      "width": "100%"
    },
    "tracks": [
      {
        "source": "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
        "type": "top-chromosome-axis",
        "width": 35
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
]
`
            )

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
        
    handleSubmit(event) {
        event.preventDefault();

        console.log('this.refs:', this.refs);
        let configText = ReactDOM.findDOMNode(this.refs.textConfigInput).value;
        let viewConfig = JSON.parse(configText);
        this.updateLinkedViews(viewConfig);

        this.setState(
         {
             viewConfig : viewConfig
         });

        console.log('handling submit:', this.state.viewConfig);
    }

    /*
    updateDimensions() {
        let width =ReactDOM.findDOMNode(this.displayPanel).offsetWidth;
        console.log('new width:', width);
    }

    componentDidMount() {
        window.addEventListener('resize', this.updateDimensions.bind(this));
    }
    */

    render() {
        let divStyle = {"paddingLeft": "20px",
                        "paddingRight": "20px"}
        console.log('rendering HiGlassApp:', this.state.viewConfig);
        return (
                <div style={divStyle}>
                <Panel header='Input' bsSize={'small'}>
                <form onSubmit={this.handleSubmit.bind(this)}>
                   <FormGroup controlId="formControlsTextarea">
                         <ControlLabel>Textarea</ControlLabel>
                               <FormControl 
                                 componentClass="textarea" rows={5} 
                                 defaultValue={JSON.stringify(this.state.viewConfig,null,2)} 
                                 ref='textConfigInput' 
                                />

                                   </FormGroup>
                        <Button
                            className="pull-right"
                            bsStyle="primary"
                            type="submit"
                    >Submit</Button>
                    </form>
                </Panel>

                <Panel header='Display' ref='displayPanel'>
                    <MultiViewContainer viewConfig={this.state.viewConfig}
                    />
                </Panel>
                </div>
        );
    }
}

