import React from 'react';
import {Button, FormControl} from 'react-bootstrap';

export class AddTrackDiv extends React.Component {
    constructor(props) {
        super(props);


    }

    render() {
        let thisDivStyle = { 'position': 'absolute',
                             'right': 0,
                             'bottom': 10}
        let iStyle = { 'opacity': 0.7 };
        return (<div style={thisDivStyle}>
                    <i className='fa fa-link' aria-hidden='true' style={iStyle}></i>
                    {'  '}
                    <FormControl type="text"
                    /> 
                    {' '}
                    <Button type="submit">
                    Add Track
                    </Button>
                </div>);
    }

}
