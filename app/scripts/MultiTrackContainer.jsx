import React from 'react';

export class MultiTrackContainer extends React.Component {
    constructor(props) {
        super(props);

        this.state =  {
            width: 448,     // should be changeable on resize
            height: 40,     // should change in response to the addition of new tracks
                            // or user resize
            tracks: []
        };
    }

    handleResize(newDimensions) {
        this.setState (
                {
                    width: newDimensions.width,
                    height: newDimensions.height
                });
    }

    render() {
        let divStyle = { height: this.state.height, 
                         width: this.state.width,
                         position: 'relative' }
        let imgStyle = { right: 10,
                         bottom: 10,
                         position: 'absolute' }

        return(
            <div style={divStyle}>
                <img src="images/plus.svg" width="20px" style={imgStyle}/>
            </div>
        );
    }
}
