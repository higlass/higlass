import { isCombinedTrackConfig } from './type-guards';

/** @import * as t from '../types' */

/**
 * Go through a list of tracks and expand combined
 * tracks.
 *
 * @param {Array<t.TrackConfig>} trackList - A list of tracks some of which might be combined
 * @returns {Array<t.UnknownTrackConfig>} A list of tracks without combined
 */
const expandCombinedTracks = (trackList) => {
  /** @type {Array<t.UnknownTrackConfig>} */
  let newTracks = [];

  for (const track of trackList) {
    if (isCombinedTrackConfig(track)) {
      newTracks = newTracks.concat(track.contents);
    } else {
      newTracks.push(track);
    }
  }

  return newTracks;
};

export default expandCombinedTracks;
