import { json } from 'd3-request';
import React from 'react';
import ReactDOM from 'react-dom';
import { HiGlassComponent } from './HiGlassComponent.jsx';

function launch(parent, config, options) {

  if (!options) options = {};

  ReactDOM.render((<HiGlassComponent
              viewConfig={config}
              options={options}
              />), parent);
}

export function HgComponent(parent, config, options) {
    /**
     * Available options:
     *
     *  bounded: [true/false]
     *      Fit the container to the bounds of the parent
     */
  if (typeof config === 'string') {
    // Load external config
    json(config, (error, data) => {
      if (error) throw error;

     launch(parent, data, options);
    });
  } else {
   launch(parent, config, options);
  }
}

export default {
  HgComponent
}
