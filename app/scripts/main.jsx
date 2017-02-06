import React from 'react';
import ReactDOM from 'react-dom';
import {HiGlassApp} from './HiGlassApp.js';

try {
ReactDOM.render(
    <HiGlassApp viewConfigString={JSON.stringify(developmentDemo)}/>
    , document.getElementById('development-demo')
    );
} catch (e) {
    console.error('error:', e);
}
