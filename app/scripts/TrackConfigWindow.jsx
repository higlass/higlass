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
        console.log('showing left:', this.props.position.left);
        return(<div
                    style={{ 
                            position: 'fixed',
                            left: this.props.position.left,
                             top: this.props.position.top,
                            border: "1px solid black"
                          }}
                >
                    Heidi Ho
        
                </div>)
    }
}
