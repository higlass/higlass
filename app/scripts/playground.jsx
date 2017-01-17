import React from 'react';
import ReactDOM from 'react-dom';
import {HiGlassApp} from './HiGlassApp.js';

try {
ReactDOM.render(
    <HiGlassApp />
    , document.getElementById('development-demo')
    );
} catch (e) {
    console.log('error:', e);
}
