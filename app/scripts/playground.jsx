import React from 'react';
import ReactDOM from 'react-dom';
import {HiGlassDemo} from './HiGlassDemo.jsx';

try {
ReactDOM.render(
    <HiGlassDemo />
    , document.getElementById('development-demo')
    );
} catch (e) {
    console.log('error:', e);
}
