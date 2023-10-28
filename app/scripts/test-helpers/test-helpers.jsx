// @ts-nocheck
import React from 'react';
import ReactDOM from 'react-dom';

// eslint-disable-next-line import/no-extraneous-dependencies
import { mount } from 'enzyme';

import { requestsInFlight } from '../services';

import { getTrackObjectFromHGC, getTrackRenderer } from '../utils';

import HiGlassComponent from '../HiGlassComponent';

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
    } else if (
      (track.track.data && track.track.data.type === 'divided') ||
      (track.track.server && track.track.tilesetUid)
    ) {
      if (trackObj.originalTrack) {
        trackObj = trackObj.originalTrack;
      }

      if (!(trackObj.tilesetInfo || trackObj.chromInfo)) {
        // console.warn(
        //   `Track uuid:${trackObj.uuid} has no tileset or chromosome info`
        // );
        return true;
      }

      if (trackObj.fetching && trackObj.fetching.size) {
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

export const removeHGComponent = (div) => {
  if (!div) return;

  ReactDOM.unmountComponentAtNode(div);
  document.body.removeChild(div);
};

// ideally the "await-ers" avoid would be promises (rather than polling)
// and that way `mountHGComponent` would be async by default.
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
