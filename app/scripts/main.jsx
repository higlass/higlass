import React from 'react';
import ReactDOM from 'react-dom';
import {MultiTrackContainer} from './MultiTrackContainer.jsx';
import $ from 'jquery';

ReactDOM.render(
    <div>
        <MultiTrackContainer domain={[0,3000000000]} />
    </div>,
        document.getElementById('circle')
    );

console.log('\'Allo \'Allo!');
