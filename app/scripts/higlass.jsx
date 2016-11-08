import React from 'react';
import ReactDOM from 'react-dom';
import {HiGlassApp} from './HiGlassApp.js';

export function HiGlassContainer(elementId, viewConfigStr) {
    try {
        ReactDOM.render(
            <HiGlassApp viewConfigString={viewConfigStr}/>
                , document.getElementById(elementId)
            );
    } catch (e) {
        console.log('error:', e);
    }
}
