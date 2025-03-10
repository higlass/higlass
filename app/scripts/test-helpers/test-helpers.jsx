import React from 'react';
import ReactDOM from 'react-dom';

import { mount } from 'enzyme';

import { requestsInFlight } from '../services';

import { getTrackObjectFromHGC, getTrackRenderer } from '../utils';

import HiGlassComponent from '../HiGlassComponent';

const TILE_LOADING_CHECK_INTERVAL = 100;

/**
 * Change the options of a track in higlass
 *
 * @param {import("enzyme").ReactWrapper<{}, {}, HiGlassComponent>} hgc - Enzyme wrapper for a HiGlassComponent
 * @param {string} viewUid - The view uid
 * @param {string} trackUid - The track uid
 * @param {Record<string, unknown>} options - An object of new options (e.g. { color: 'black'})
 * @returns {void}
 */
export const changeOptions = (hgc, viewUid, trackUid, options) => {
  for (const { viewId, trackId, track } of hgc.instance().iterateOverTracks()) {
    if (viewId === viewUid && trackId === trackUid) {
      track.options = {
        ...track.options,
        ...options,
      };
    }
  }

  hgc.setState(hgc.instance().state);
};

/**
 * Check if there are any active transitions that we need to wait on.
 *
 * @param {HiGlassComponent} hgc
 *
 * @returns {boolean} Whether any of the tracks have active transtions.
 */
export const areTransitionsActive = (hgc) => {
  for (const track of hgc.iterateOverTracks()) {
    const trackRenderer = getTrackRenderer(hgc, track.viewId);

    if (trackRenderer?.activeTransitions) return true;
  }
  return false;
};

/**
 * Waits for multiple elements to appear in the DOM and executes a callback when all are found.
 *
 * @param {HTMLElement} parent - The parent element to search within.
 * @param {string[]} selectors - An array of CSS selectors for the elements to wait for.
 * @returns {Promise<Array<HTMLElement>>}
 */
const waitForElements = (parent, selectors) => {
  const foundElements = new Map();
  /** @type {PromiseWithResolvers<Array<HTMLElement>>} */
  const { promise, resolve } = Promise.withResolvers();

  const observer = new MutationObserver((mutations, obs) => {
    selectors.forEach((selector) => {
      if (!foundElements.has(selector)) {
        const element = parent.querySelector(selector);
        if (element) {
          foundElements.set(selector, element);
        }
      }
    });

    // If all elements are found, trigger the callback and disconnect
    if (foundElements.size === selectors.length) {
      resolve([...foundElements.values()]); // Pass all elements to the callback
      obs.disconnect();
    }
  });

  observer.observe(parent, {
    childList: true,
    subtree: true,
  });

  // Initial check in case elements are already present
  selectors.forEach((selector) => {
    const element = parent.querySelector(selector);
    if (element) {
      foundElements.set(selector, element);
    }
  });

  if (foundElements.size === selectors.length) {
    resolve([...foundElements.values()]);
    observer.disconnect();
  }

  return promise;
};

/**
 * Wait until all transitions have finished before calling the callback
 *
 * @param {HiGlassComponent} hgc
 * @param {() => void} callback A callback to invoke when all tiles have been loaded.
 * @returns {void}
 */
export const waitForTransitionsFinished = (hgc, callback) => {
  if (areTransitionsActive(hgc)) {
    setTimeout(() => {
      waitForTransitionsFinished(hgc, callback);
    }, TILE_LOADING_CHECK_INTERVAL);
  } else {
    callback();
  }
};

/**
 * Wait until all open JSON requests are finished
 *
 * @param {() => void} finished - A callback to invoke when there's no more JSON requests open.
 * @returns {void}
 */
export const waitForJsonComplete = (finished) => {
  if (requestsInFlight > 0) {
    setTimeout(
      () => waitForJsonComplete(finished),
      TILE_LOADING_CHECK_INTERVAL,
    );
  } else {
    finished();
  }
};

/**
 * Check if a HiGlassComponent is still waiting on tiles from a remote server.
 *
 * @param {HiGlassComponent} hgc
 * @returns {boolean} Whether any of the tracks are wating for tiles.
 *
 */
export const isWaitingOnTiles = (hgc) => {
  for (const track of hgc.iterateOverTracks()) {
    let trackObj = getTrackObjectFromHGC(hgc, track.viewId, track.trackId);

    if (
      !track.track.server &&
      !track.track.tilesetUid &&
      !(track.track.data && track.track.data.type === 'divided')
    ) {
      continue;
    }
    if (
      (track.track.data && track.track.data.type === 'divided') ||
      (track.track.server && track.track.tilesetUid)
    ) {
      if (!trackObj) return true;

      if (trackObj.originalTrack) {
        trackObj = trackObj.originalTrack;
      }

      if (!(trackObj.tilesetInfo || trackObj.chromInfo)) {
        // console.warn(
        //   `Track uuid:${trackObj.uuid} has no tileset or chromosome info`
        // );
        return true;
      }

      if (trackObj.fetching?.size) {
        return true;
      }
    } else {
      throw Error('"server" and "tilesetUid" belong together');
    }
  }

  return false;
};

/**
 * Wait until all of the tiles in the HiGlassComponent are loaded until calling the callback
 *
 * @param {HiGlassComponent} hgc
 * @param {(value?: unknown) => void} tilesLoadedCallback A callback to invoke whenever all of the tiles have been loaded.
 * @returns {void}
 */
export const waitForTilesLoaded = (hgc, tilesLoadedCallback) => {
  if (isWaitingOnTiles(hgc)) {
    setTimeout(() => {
      waitForTilesLoaded(hgc, tilesLoadedCallback);
    }, TILE_LOADING_CHECK_INTERVAL);
  } else {
    // console.log('finished');
    tilesLoadedCallback();
  }
};

/**
 * Mount a new HiGlassComponent and unmount the previously visible one.
 *
 * @param {HTMLDivElement | null} prevDiv - A div element to detach and recreate for the component
 * @param {import("enzyme").ReactWrapper<{}, {}, HiGlassComponent> | null} prevHgc
 * @param {Record<string, unknown>} viewConf
 * @param {(value?: unknown) => void} done - The callback to call when the component is fully loaded
 * @param {{ style?: string, bounded?: boolean, extendedDelay?: boolean }} [options]
 */
export const mountHGComponent = (
  prevDiv,
  prevHgc,
  viewConf,
  done,
  options = {},
) => {
  const {
    style = 'width:800px; background-color: lightgreen;',
    bounded = false,
    extendedDelay = false,
  } = options;

  if (prevHgc) {
    prevHgc.unmount();
    prevHgc.detach();
  }

  if (prevDiv) {
    global.document.body.removeChild(prevDiv);
  }

  // console.log('check:', options && options.style)
  // console.log('style:', style, "options:", options, "style", options.style);

  const div = global.document.createElement('div');
  global.document.body.appendChild(div);

  div.setAttribute('style', style);
  div.setAttribute('id', 'simple-hg-component');

  /** @type {import("enzyme").ReactWrapper<{}, {}, HiGlassComponent>} */
  const hgc = mount(
    <HiGlassComponent options={{ bounded }} viewConfig={viewConf} />,
    { attachTo: div },
  );

  hgc.update();

  waitForJsonComplete(() => {
    if (extendedDelay) {
      // Waiting for tiles to be loaded does not always mean
      // that the compoment is mounted (especially if we load the tiles
      // from the filesystem, which is quick). Wait 1000ms to make sure
      // we are really done
      const doneWithDelay = () =>
        setTimeout(() => {
          done();
        }, 1000);

      waitForTilesLoaded(hgc.instance(), doneWithDelay);
    } else {
      waitForTilesLoaded(hgc.instance(), done);
    }
  });

  return /** @type {const} */ ([div, hgc]);
};

/** Wait for scales to stop changing.
 *
 * @param {HiGlassComponent} hgc
 * @param {string} viewUid
 * @param {Object} options
 * @param {number} [options.timeInterval] - The interval (in milliseconds) between size checks.
 * @param {number} [options.maxTime] - The maximum time (in milliseconds) to wait for stabilization.
 * @returns {Promise<void>}
 */
export const waitForScalesStabilized = async (hgc, viewUid, options) => {
  const { timeInterval = 100, maxTime = 3000 } = options;
  const xScaleDomain = [0, 0];
  const yScaleDomain = [0, 0];

  for (let i = 0; i < maxTime; i += timeInterval) {
    const xScale = hgc.xScales[viewUid];
    const yScale = hgc.yScales[viewUid];

    if (
      xScaleDomain[0] !== xScale.domain()[0] ||
      xScaleDomain[1] !== xScale.domain()[1] ||
      yScaleDomain[0] !== yScale.domain()[0] ||
      yScaleDomain[1] !== yScale.domain()[1]
    ) {
      xScaleDomain[0] = xScale.domain()[0];
      xScaleDomain[1] = xScale.domain()[1];
      yScaleDomain[0] = yScale.domain()[0];
      yScaleDomain[1] = yScale.domain()[1];
    } else {
      return;
    }

    await new Promise((r) => setTimeout(r, timeInterval));
  }
};

/**
 * Wait for a HiGlassComponet to be ready at the given element.
 *
 * By ready we mean that a track-renderer-div is present and that its
 * size is not changing any more.
 *
 * @param {HTMLElement} div
 * @returns {Promise<void>}
 */
export const waitForComponentReady = async (div) => {
  await waitForElements(div, ['.track-renderer-div']);
};

/**
 * @param {HTMLDivElement} div
 * @returns {void}
 */
export const removeHGComponent = (div) => {
  if (!div) return;

  ReactDOM.unmountComponentAtNode(div);
  document.body.removeChild(div);
};

// ideally the "await-ers" avoid would be promises (rather than polling)
// and that way `mountHGComponent` would be async by default.
/**
 * @param {HTMLDivElement | null} prevDiv
 * @param {import("enzyme").ReactWrapper<{}, {}, HiGlassComponent> | null} prevHgc
 * @param {Record<string, unknown>} viewConf
 * @param {{ style?: string, bounded?: boolean, extendedDelay?: boolean }} [options]
 * @returns {Promise<[HTMLDivElement, { instance: () => HiGlassComponent }]>}
 */
export async function mountHGComponentAsync(
  prevDiv,
  prevHgc,
  viewConf,
  options,
) {
  /** @type {ReturnType<typeof mountHGComponent>}*/
  let res;
  await new Promise((resolve) => {
    res = mountHGComponent(prevDiv, prevHgc, viewConf, resolve, options);
  });
  // @ts-expect-error We know it's been resolved
  return res;
}
