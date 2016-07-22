import React from 'react';
import ReactDOM from 'react-dom';
import {MultiTrackContainer} from './MultiTrackContainer.jsx';
import $ from 'jquery';

ReactDOM.render(
    <MultiTrackContainer domain={[0,5000000]} />,
        document.getElementById('circle')
    );

console.log('\'Allo \'Allo!');
