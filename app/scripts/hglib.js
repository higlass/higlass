import React from 'react';
import ReactDOM from 'react-dom';
import HiGlassComponent from './HiGlassComponent';

export { default as ChromosomeInfo } from './ChromosomeInfo';
export { default as HiGlassComponent } from './HiGlassComponent';

const launch = (element, config, options, callback) => {
  /**
   * The instance's public API will be passed into the callback
   *
   * @param   {Object} higlass - HiGlass instance
   * @return  {Object} The instance's public API
   */
  let component = ReactDOM.render(
    <HiGlassComponent
      ref={(c) => { 
        console.log('returning HGC');
        callback && callback(c.api);
      }}
      options={options || {}}
      viewConfig={config}
    />,
    element,
  );

  return component;
};

/**
 * Create a HiGlass component
 *
 * @param  {Object}  element  DOM element the HiGlass component should be
 *   associated to.
 * @param  {Object|String}  viewConfig  Dictionary or URL of a view config.
 * @param  {Object}  options  Dictionary of public options.
 * @param  {Function}  callback  Callback function for the API.
 * @return  {Object}  Newly created HiGlass component.
 */
export const createHgComponent = (element, viewConfig, options, callback) => {
  /**
   * Available options:
   *
   *  bounded: [true/false]
   *      Fit the container to the bounds of the element
   */
  const hg = launch(element, viewConfig, options, callback);
  return hg && hg.api;
};

export const viewer = createHgComponent;

export default createHgComponent;
