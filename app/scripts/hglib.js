import React from 'react';
import ReactDOM from 'react-dom';
import HiGlassComponent from './HiGlassComponent';

// these exports can be used to create new tracks in outside
// environments (e.g. Observable)
import SVGTrack from './SVGTrack';
import TiledPixiTrack from './TiledPixiTrack';
import HorizontalGeneAnnotationsTrack from './HorizontalGeneAnnotationsTrack';

export { default as ChromosomeInfo } from './ChromosomeInfo';
export { default as HiGlassComponent } from './HiGlassComponent';
export {
  default as HiGlassTrackComponent,
  trackViewer,
} from './HiGlassTrackComponent';

export const tracks = {
  SVGTrack,
  TiledPixiTrack,
  HorizontalGeneAnnotationsTrack,
};

export { default as schema } from '../schema.json';

// export functions that are useful for testing
export {
  waitForJsonComplete,
  waitForTilesLoaded,
  waitForTransitionsFinished,
  mountHGComponent,
  getTrackObjectFromHGC,
} from './utils';

export const version = VERSION;

const launch = (element, config, options) => {
  /**
   * The instance's public API will be passed into the callback
   *
   * @param {DOMElement} element The element to attach the HiGlass component to
   *  E.g. ``document.getElementById('two-heatmaps')``
   *
   * @param {Object} config The viewconfig to load. If this parameter is a string
   * it will be interpreted as a url from which to retrieve the viewconf.
   *
   * @param {Object} options Options that affect how the component is drawn and
   * and behaves.
   *
   * @return  {Object} The instance's public API
   */
  const ref = React.createRef();
  ReactDOM.render(
    <HiGlassComponent ref={ref} options={options || {}} viewConfig={config} />,
    element,
  );
  return ref.current;
};

/**
 * Create a HiGlass component.
 *
 * In addition to the parameters below, a number of extra options can be passed
 * using the **options** parameter:
 *
 * * **authToken** *(string)* - An auth token to be included with every tile request
  (e.g. ``JWT xyz``)
 * * **bounded** *(bool)* - A boolean specifying whether the component should be sized
  to fit within the enclosing div [default=false]. If it is false, then the component
  will grow as needed to fit the tracks within it.
 * * **editable** *(bool)* - Can the layout be changed? If false, the view headers will
  be hidden. This can also be specified in the viewconfig using the ``editable`` option.
  The value passed here overrides the value in the viewconf. [default=true]
 * * **defaultTrackOptions** *(dict)* - Specify a set of default options that will be used for
 *  newly added tracks. These can be broken down into two types: `all` - affecting all
 *  all track types and `trackSpecific` which will affect only some track types. See the
 *  example below for a concrete demonstration.
 * @param  {Object}  element  DOM element the HiGlass component should be
 *   attached to.
 * @param  {Object|String}  viewConfig  The viewconfig to load. If this parameter is a string
 * it will be interpreted as a url from which to retrieve the viewconf. If it is a dictionary
 * it will be loaded as is.
 * @param  {Object}  options  Dictionary of public options. See the description above for a list
   of available values.
 * @example
 *
 * const hgv = hglib.viewer(
 *  document.getElementById('development-demo'),
 *  testViewConfig,
 *  { bounded: true,
 *   defaultTrackOptions: {
 *     all: {
 *       showTooltip: true,
 *     },
 *     trackSpecific: {
 *      'heatmap': {
 *        showTooltip: false,
 *      }
 *     }
 *   }
 * });
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
