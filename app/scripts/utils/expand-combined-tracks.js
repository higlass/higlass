/** @import {TrackConfig, UnknownTrackConfig} from '../types' */

/**
 * Go through a list of tracks and expand combined
 * tracks.
 *
 * @param {Array<TrackConfig>} trackList - A list of tracks some of which might be combined
 * @returns tracks: A list of tracks without combined
 */
const expandCombinedTracks = (trackList) => {
  /** @type {Array<UnknownTrackConfig>} */
  const newTracks = [];

  for (const track of trackList) {
    if ('contents' in track) {
      newTracks.concat(track.contents);
    } else {
      newTracks.push(track);
    }
  }

  return newTracks;
};

export default expandCombinedTracks;
