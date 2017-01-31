import { json } from 'd3-request';
import React from 'react';
import ReactDOM from 'react-dom';
import { HiGlassComponent } from './HiGlassComponent.jsx';

export {defaultViewConfig} from './viewconfs.js';
export {localViewConfig} from './viewconfs.js';
export {testViewConfig} from './viewconfs.js';


function launch (element, config, options, callback) {
  /**
   * The instance's public API will be passed into the callback
   *
   * @method
   * @author  Fritz Lekschas
   * @date    2017-01-31
   * @param   {Object} higlass - HiGlass instance
   * @return  {Object} The instance's public API
   */
  callback((function (higlass) {
      return higlass.api();
    } (
      ReactDOM.render(
        (<HiGlassComponent
            options={options || {}}
            viewConfig={config}
         />),
        element
      )
    )
  ));
}


export function create (element, config, options, callback) {
  /**
   * Available options:
   *
   *  bounded: [true/false]
   *      Fit the container to the bounds of the element
   */
  if (typeof config === 'string') {
    // Load external config
    json(config, (error, data) => {
      if (error) throw error;

     launch(element, data, options, callback);
    });
  } else {
   launch(element, config, options, callback);
  }
}

export default create;
