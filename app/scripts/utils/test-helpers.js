import { requestsInFlight } from '../services';

import {
  getTrackObjectFromHGC,
  getTrackRenderer,
} from '.';

const TILE_LOADING_CHECK_INTERVAL = 100;

export const areTransitionsActive = (hgc) => {
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
  for (const track of hgc.iterateOverTracks()) {
    const trackRenderer = getTrackRenderer(hgc,
      track.viewId,
      track.trackId);

    if (trackRenderer.activeTransitions > 0) return true;
  }
  return false;
};

export const waitForTransitionsFinished = (hgc, callback) => {
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
  // console.log('jasmine.DEFAULT_TIMEOUT_INTERVAL', jasmine.DEFAULT_TIMEOUT_INTERVAL);

  if (areTransitionsActive(hgc)) {
    setTimeout(() => {
      waitForTransitionsFinished(hgc, callback);
    }, TILE_LOADING_CHECK_INTERVAL);
  } else {
    // console.log('finished');
    callback();
  }
};

export const waitForJsonComplete = (finished) => {
  /*
   * Wait until all open JSON requests are finished
   *
   * Parameters
   * ----------
   *  finished: function
   *    A callback to call when there's no more JSON requests
   *    open
   *
   */
  if (requestsInFlight > 0) {
    setTimeout(() => waitForJsonComplete(finished),
      TILE_LOADING_CHECK_INTERVAL);
  } else {
    finished();
  }
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
  const TILE_LOADING_CHECK_INTERVAL = 100;
  // console.log('jasmine.DEFAULT_TIMEOUT_INTERVAL', jasmine.DEFAULT_TIMEOUT_INTERVAL);

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

    if (track.track.type === 'viewport-projection-vertical'
        || track.track.type === 'viewport-projection-horizontal'
        || track.track.type === 'viewport-projection-center'
        || track.track.type === 'osm-tiles'
        || track.track.type === 'osm-2d-tile-ids') continue;

    if (trackObj.originalTrack) { trackObj = trackObj.originalTrack; }

    if (!trackObj) {
      // console.warn('no track obj', getTrackObject(hgc, track.viewId, track.trackId));
    }

    if (!(trackObj.tilesetInfo || trackObj.chromInfo)) {
      // console.warn('no tileset info');
      return true;
    }

    // if (trackObj.fetching)
    //   console.log('trackObj.fetching.size:', trackObj.fetching);

    if (trackObj.fetching && trackObj.fetching.size) {
      return true;
    }
  }

  return false;
};
