/** @import { PositionedTracks } from './visit-positioned-tracks' */
/** @import { TrackConfig, TrackPosition } from '../types' */

import { TRACK_LOCATIONS } from '../configs';

/**
 * Convert the position indexed list of tracks.
 *
 * If `includeCombinedContents` is `true`, tracks inside
 * `combined.contents` will also be included in the output.
 *
 * @template {{ type: string } | { type: 'combined', contents: Array<T> }} T
 *
 * @param {PositionedTracks<T>} positionedTracks
 * @param {{ includeCombinedContents?: boolean }} options
 * @returns {Array<T & { position: TrackPosition }>}
 *
 */
const positionedTracksToAllTracks = (
  positionedTracks,
  { includeCombinedContents = true } = {},
) => {
  /** @type {Array<T & { position: keyof PositionedTracks }>} */
  const allTracks = [];

  for (const trackType of TRACK_LOCATIONS) {
    const theseTracks = positionedTracks[trackType];

    theseTracks?.forEach((x) => {
      if ('contents' in x) {
        // we don't really deal with nested combined tracks here,
        // but those shouldn't really be used anyway
        if (includeCombinedContents) {
          x.contents.forEach((y) => {
            allTracks.push(
              Object.assign({}, y, {
                position: trackType,
              }),
            );
          });
        }
      }

      allTracks.push(
        Object.assign({}, x, {
          position: trackType,
        }),
      );
    });
  }

  return allTracks;
};

export default positionedTracksToAllTracks;
