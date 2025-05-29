import React from 'react';
import ReactDOM from 'react-dom';
import HiGlassComponent from './HiGlassComponent';

import HorizontalGeneAnnotationsTrack from './HorizontalGeneAnnotationsTrack';
// these exports can be used to create new tracks in outside environments (e.g. Observable)
import SVGTrack from './SVGTrack';
import TiledPixiTrack from './TiledPixiTrack';

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

export { default as schema } from '../schema.json' with { type: 'json' };
export { version } from '../../package.json' with { type: 'json' };

/** @import * as api from './api' */
/** @import * as types from './types' */

/** @typedef {api.HiGlassApi["public"]} HiGlassApi */
/** @typedef {types.HiGlassOptions} HiGlassOptions */
/** @typedef {types.HiGlassViewConfig} HiGlassViewConfig */

// export functions that are useful for testing
export {
  waitForJsonComplete,
  waitForTilesLoaded,
  waitForTransitionsFinished,
  mountHGComponent,
} from './test-helpers';

export {
  debounce,
  getDefaultTracksForDatatype,
  getTrackByUid,
  getTrackObjectFromHGC,
} from './utils';

export { TRACKS_INFO_BY_TYPE } from './configs';
export { OPTIONS_INFO } from './options-info';
/**
 * Create a `HiGlassComponent` instance.
 *
 * @param {HTMLElement} element - The element to attach the HiGlassComponent.
 * @param {HiGlassViewConfig} config - The view configuration.
 * @param {HiGlassOptions} [options] - How the component is drawn and and behaves.
 *
 * @returns {Promise<HiGlassComponent>}
 */
const launch = async (element, config, options = {}) => {
  return new Promise((resolve) => {
    ReactDOM.render(
      <HiGlassComponent
        ref={(/** @type {HiGlassComponent | null} */ ref) => {
          // Wait to resolve until React gives us a ref
          ref && resolve(ref);
        }}
        options={options}
        viewConfig={config}
      />,
      element,
    );
  });
};

/**
 * Create a HiGlass component.
 *
 * @param {HTMLElement} element - DOM element to render the HiGlass component.
 * @param {HiGlassViewConfig | string} viewConfig - The view config to load.
 * @param {HiGlassOptions} [options] - Additional options for how the HiGlass component is drawn and behaves
 * @returns  {Promise<HiGlassApi>}  Newly created HiGlass component.
 *
 * Note: If `viewConfig` is a string, it will be interpreted as a url from which to retrieve the viewconf.
 *
 * @example
 * ```js
 * const hgv = hglib.viewer(document.querySelector('#app'), viewconf, {
 *   bounded: true,
 *   defaultTrackOptions: {
 *     all: { showTooltip: true },
 *     trackSpecific: {
 *       heatmap: { showTooltip: false }
 *     }
 *   }
 * });
 * ```
 */
export const viewer = async (element, viewConfig, options = {}) => {
  const hg = await launch(
    element,
    typeof viewConfig === 'string'
      ? await fetch(viewConfig).then((response) => response.json())
      : viewConfig,
    options,
  );
  return hg.api;
};

export * as hggos from './gosling-exports';
