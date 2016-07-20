import React from 'react';
import PIXI from 'pixi.js';
import d3 from 'd3';
import {DraggableDiv} from './DraggableDiv.js';
import slugid from 'slugid';

export class MultiTrackContainer extends React.Component {
    constructor(props) {
        super(props);

        this.awsDomain = '//52.23.165.123:9872';
        this.trackHeight = 30;

        this.state =  {
            width: 448,     // should be changeable on resize
            height: 40,     // should change in response to the addition of new tracks
                            // or user resize
            tracks: [
                     {source: this.awsDomain + '/tiles_test/wgEncodeCrgMapabilityAlign36mer.bw.genome.sorted.short.gz', uid: slugid.nice()},
                     {source: this.awsDomain + '/tiles_test/wgEncodeCrgMapabilityAlign36mer.bw.genome.sorted.short.gz', uid: slugid.nice()},
            ]
        };

        this.animate = this.animate.bind(this);
        this.zoom = d3.behavior.zoom().on('zoom', () => { console.log('zoomed'); }) ;
    }

    handleResize(newDimensions) {
        this.setState (
                {
                    width: newDimensions.width,
                    height: newDimensions.height
                });
    }

    componentDidMount() {
        this.renderer = PIXI.autoDetectRenderer(this.state.width, 
                                                this.state.height, 
                                                { view: this.canvas,
                                                  antialiased: true, 
                                                  transparent: true } )
        this.stage = new PIXI.Container();
        this.stage.interactive = true;

        this.animate();
        d3.select(this.bigDiv).call(this.zoom);
    }

    animate() {
        this.renderer.render(this.stage);
        this.frame = requestAnimationFrame(this.animate);
    }

    trackSizeChanged(newSize) {
        console.log('trackSizeChanged', newSize);
    }

    render() {
        let divStyle = { height: this.state.height, 
                         width: this.state.width,
                         position: 'relative' }
        let imgStyle = { right: 10,
                         bottom: 10,
                         position: 'absolute' }
        let canvasStyle = { top: 0,
                            left: 0,
                            width: this.width,
                            height: this.height };

        return(
            <div style={divStyle} ref={(c) => this.bigDiv = c}>
                <canvas ref={(c) => this.canvas = c} style={canvasStyle}/>
                <img src="images/plus.svg" width="20px" style={imgStyle}/>
                { this.state.tracks.map(function(track, i) 
                        {

                            console.log('track.uid:', track.uid, i);
                            return <DraggableDiv width={100} 
                                                 height={40} 
                                                 top={i * this.trackHeight} 
                                                 left={0} 
                                                 sizeChanged={this.trackSizeChanged} 
                                                 key={track.uid}
                                                 uid={track.uid}
                                    />;

                        }.bind(this)) 
                }
            </div>
        );
    }
}
