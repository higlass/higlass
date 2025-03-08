// @ts-nocheck
import React from 'react';
import ReactDOM from 'react-dom';

import { mount } from 'enzyme';

import { requestsInFlight } from '../services';

import { getTrackObjectFromHGC, getTrackRenderer } from '../utils';

import HiGlassComponent from '../HiGlassComponent';
import { element } from 'prop-types';

const TILE_LOADING_CHECK_INTERVAL = 100;

/**
 * Change the options of a track in higlass
 * @param  hgc      enzyme wrapper for a HiGlassComponent
 * @param  viewUid  The view uid
 * @param  trackUid The track uid
 * @param  options  An object of new options (e.g. { color: 'black'})
 * @return          nothing
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
 * Check if there are any active transitions that we
 * need to wait on
 *
 * Parameters
 * ----------
 *  hgc: enzyme wrapper for a HiGlassComponent
 *
 * Returns
 * -------
 *  True if any of the tracks have active transtions. False otherwise.
 */
export const areTransitionsActive = (hgc) => {
  for (const track of hgc.iterateOverTracks()) {
    const trackRenderer = getTrackRenderer(hgc, track.viewId, track.trackId);

    if (trackRenderer.activeTransitions > 0) return true;
  }
  return false;
};

/**
 * Waits for multiple elements to appear in the DOM and executes a callback when all are found.
 *
 * @param {HTMLElement} parent - The parent element to search within.
 * @param {string[]} selectors - An array of CSS selectors for the elements to wait for.
 * @param {(elements: HTMLElement[]) => void} callback - A function that is called when all elements are found.
 * The callback receives an array of the found elements.
 */
export const waitForElements = (parent, selectors, callback) => {
  const foundElements = new Map();

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
      callback([...foundElements.values()]); // Pass all elements to the callback
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
    callback([...foundElements.values()]);
    observer.disconnect();
  }
};

/**
 * Wait until all transitions have finished before
 * calling the callback
 *
 * Arguments
 * ---------
 *  hgc: Enzyme wrapper for a HiGlassComponent
 *      The componentthat we're waiting on
 *  tilesLoadedCallback: function
 *      The callback to call whenever all of the tiles
 *      have been loaded.
 * Returns
 * -------
 *  Nothing
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
 * Parameters
 * ----------
 *  finished: function
 *    A callback to call when there's no more JSON requests
 *    open
 *
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
 * Check if a HiGlassComponent is still waiting on tiles from a remote
 * server.
 *
 * Arguments
 * ---------
 *  hgc: enzyme wrapper for a HiGlassComponent
 *
 * Returns
 * -------
 *  True if any of the tracks are waiting for tiles, false otherwise.
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

export const waitForTilesLoaded = (hgc, tilesLoadedCallback) => {
  /**
   * Wait until all of the tiles in the HiGlassComponent are loaded
   * until calling the callback
   *
   * Arguments
   * ---------
   *  hgc: Enzyme wrapper for a HiGlassComponent
   *      The componentthat we're waiting on
   *  tilesLoadedCallback: function
   *      The callback to call whenever all of the tiles
   *      have been loaded.
   * Returns
   * -------
   *  Nothing
   */
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
 * @param {HTMLElement | null} prevDiv A div element to detach and recreate for the component
 * @param {import('enzyme').ReactWrapper | null} prevHgc An already mounted
 *  hgc component
 * @param {function} done The callback to call when the component is fully loaded
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

/**
 * Wait for a set of elements to stabilize in size.
 *
 * Returns when none of the elements have resized.
 *
 * @param {HTMLElement[]} elements - The elements to monitor for size changes.
 * @param {number} [timeInterval] - The interval (in milliseconds) between size checks.
 * @param {number} [maxTime] - The maximum time (in milliseconds) to wait for stabilization.
 */
export const waitForSizeStabilization = async (
  elements,
  timeInterval,
  maxTime,
) => {
  if (!timeInterval) {
    // The time between each size check
    timeInterval = 50;
  }

  if (!maxTime) {
    // The maximum time to wait until elements have
    // stopped changing sizes
    maxTime = 1000;
  }

  // Initialize to empty elements
  const prevSizes = elements.map((element) => ({
    width: 0,
    height: 0,
  }));

  for (let i = 0; i < maxTime; i += timeInterval) {
    // Every time interval, get their new size
    const newSizes = elements.map((element) => ({
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
    }));

    let different = false;

    // And check if any have changed size
    for (let j = 0; j < newSizes.length; j++) {
      if (
        newSizes[j].width !== prevSizes[j].width ||
        newSizes[j].height !== prevSizes[j].height
      ) {
        // Something has changed size, make a note of it
        // and store the new sizes to compare in the next
        // iteration
        different = true;
        prevSizes[j].width = newSizes[j].width;
        prevSizes[j].height = newSizes[j].height;
      }
    }

    // If nothing has changed, we're done
    if (!different) return;

    // Wait until the next check
    await new Promise((r) => setTimeout(r, timeInterval));
  }
};

/** Wait for scales to stop changing.
 *
 * @param {HiGlassComponent} hgc
 * @param {string} viewUid
 * @param {number} [timeInterval] - The interval (in milliseconds) between size checks.
 * @param {number} [maxTime] - The maximum time (in milliseconds) to wait for stabilization.
 * @returns
 */
export const waitForScalesStabilized = async (
  hgc,
  viewUid,
  timeInterval = 50,
  maxTime = 2000,
) => {
  const xScaleDomain = [0, 0];
  const yScaleDomain = [0, 0];

  for (let i = 0; i < maxTime; i += timeInterval) {
    const xScale = hgc.xScales[viewUid];
    const yScale = hgc.yScales[viewUid];

    console.log(
      'xScale.domain()',
      xScale.domain(),
      'yScale.domain()',
      yScale.domain(),
    );
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
 */
export const waitForComponentReady = async (div) => {
  const elementQueries = ['.track-renderer-div'];
  await new Promise((r) => waitForElements(div, elementQueries, r));

  await waitForSizeStabilization(
    // Check for size changes every 20 ms for 2000 seconds
    elementQueries.map((x) => div.querySelector(x), 20, 3000),
  );
};

export const removeHGComponent = (div) => {
  if (!div) return;

  ReactDOM.unmountComponentAtNode(div);
  document.body.removeChild(div);
};

// ideally the "await-ers" avoid would be promises (rather than polling)
// and that way `mountHGComponent` would be async by default.
/**
 * @returns {Promise<[HTMLElement, { instance: () => HiGlassComponent }]>}
 */
export async function mountHGComponentAsync(
  prevDiv,
  prevHgc,
  viewConf,
  options,
) {
  let res;
  await new Promise((resolve) => {
    res = mountHGComponent(prevDiv, prevHgc, viewConf, resolve, options);
  });
  return res;
}
