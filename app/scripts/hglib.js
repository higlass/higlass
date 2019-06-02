import React from 'react';
import ReactDOM from 'react-dom';
import HiGlassComponent from './HiGlassComponent';

export { default as ChromosomeInfo } from './ChromosomeInfo';
export { default as HiGlassComponent } from './HiGlassComponent';

export { default as SVGTrack } from './SVGTrack';
export { default as TiledPixiTrack } from './TiledPixiTrack';

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

/**
 * A barebones implementation of a HiGlass view used to display a 2d track.
 * Multiple layers can be used by specifying a `combined` track in `trackConfig`.
 *
 * Defaults to having no label and no colorbar.
 *
 * If the aspect ratio defined by the parameter bounds doesn't match the aspect
 * ration of the enclosing element, the x bounds will be respected and the y
 * y coordinates will be truncated.
 *
 * @param {element|HTMLElement} The element to attach the viewer to
 * @param {[xMin, xMax, yMin, yMax]|Array} The bounds of the track
 * @param {trackConfig: Object} The standard HiGlass track definition type
 * @returns {Object} A {id, hgApi} object
 */
export const trackViewer = (element, [xMin, xMax, yMin, yMax], trackConfig) => {
  if (!trackConfig.options.colorbarPosition) {
    trackConfig.options.colorbarPosition = 'hidden';
  }
  if (!trackConfig.options.labelPosition) {
    trackConfig.options.labelPosition = 'hidden';
  }
  const id = 'arbitary-id';
  const viewConfig = {
    editable: false,
    zoomFixed: false,
    views: [
      {
        uid: id,
        initialXDomain: [xMin, xMax],
        initialYDomain: [yMin, yMax],
        tracks: {
          center: [trackConfig],
        },
        layout: {
          w: 12,
          h: 12,
          x: 0,
          y: 0,
          moved: false,
          static: false,
        },
      },
    ],
  };
  return {
    id,
    hgApi: viewer(element, viewConfig, { bounded: true })
  };
};
