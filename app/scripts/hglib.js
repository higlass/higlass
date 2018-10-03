import React from 'react';
import ReactDOM from 'react-dom';
import HiGlassComponent from './HiGlassComponent';

export { default as ChromosomeInfo } from './ChromosomeInfo';
export { default as HiGlassComponent } from './HiGlassComponent';

// export functions that are useful for testing
export {
  waitForJsonComplete,
  waitForTilesLoaded,
  waitForTransitionsFinished,
} from './utils';

const launch = (element, config, options) => {
  /**
   * The instance's public API will be passed into the callback
   *
   * @param   {Object} higlass - HiGlass instance
   * @return  {Object} The instance's public API
   */
  let component;

  ReactDOM.render(
    <HiGlassComponent
      ref={(c) => { component = c; }}
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
 * @example
 *
 * const hgv = hglib.viewer(
 *  document.getElementById('development-demo'),
 *  testViewConfig,
 *  { bounded: true },
 * );
 *
 * @return  {Object}  Newly created HiGlass component.
 */
export const viewer = (element, viewConfig, options) => {
  /**
   * Available options:
   *
   *  bounded: [true/false]
   *      Fit the container to the bounds of the element
   */
  const hg = launch(element, viewConfig, options);

  return hg.api;
};
