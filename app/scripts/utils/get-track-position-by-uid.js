import visitPositionedTracks from './visit-positioned-tracks';

/** @import { TrackPosition } from '../types' */
/** @import { PositionedTracks } from './visit-positioned-tracks' */

/**
 * Get a track's orientation by its UID.
 *
 * @param {PositionedTracks} positionedTracks
 * @param {string} uid
 * @returns {TrackPosition | null}
 */
const getTrackPositionByUid = (positionedTracks, uid) => {
  /** @type {TrackPosition | null} */
  let position = null;

  visitPositionedTracks(positionedTracks, (track, trackPosition) => {
    if (track.uid === uid) {
      position = trackPosition;
    }
  });

  return position;
};

export default getTrackPositionByUid;
