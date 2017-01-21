import React from 'react';
import ReactDOM from 'react-dom';
import {HiGlassComponent} from './HiGlassComponent.jsx';

export function drawHg(parent, config) {
    ReactDOM.render(
            (<HiGlassComponent viewConfig={config} />), parent)
}
