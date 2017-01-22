import { json } from 'd3-request';
import React from 'react';
import ReactDOM from 'react-dom';
import { HiGlassComponent } from './HiGlassComponent.jsx';

function launch(parent, config) {
  ReactDOM.render((<HiGlassComponent viewConfig={config} />), parent);
}

export function HgComponent(parent, config) {
  if (typeof config === 'string') {
    // Load external config
    json(config, (error, data) => {
      if (error) throw error;

     launch(parent, data);
    });
  } else {
   launch(parent, config);
  }
}
