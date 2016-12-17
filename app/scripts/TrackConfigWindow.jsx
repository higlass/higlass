import React from 'react';
import ReactDOM from 'react-dom';

export class TrackConfigWindow extends React.Component {
    constructor(props) {
        /**
         * A window that is opened when a user clicks on the track configuration icon.
         */
        super(props);
        
    }

    render() {
        return(<div
                    style={{ 
                            position: 'absolute',
                            left: this.props.position.left,
                             top: this.props.position.top,
                            border: "1px solid black"
                          }}
                >
                    Heidi Ho
        
                </div>)
    }
}
