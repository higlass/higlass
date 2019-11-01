import visitPositionedTracks from './visit-positioned-tracks';

/**
 * Get a track's orientation by its UID.
 */
const getTrackPositionByUid = (positionedTracks, uid) => {
  let position = null;

  visitPositionedTracks(positionedTracks, (track, trackPosition) => {
    if (track.uid === uid) {
      position = trackPosition;
    }
  });

  return position;
};

export default getTrackPositionByUid;
