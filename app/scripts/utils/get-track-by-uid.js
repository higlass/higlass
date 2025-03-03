// @ts-nocheck
/**
 * Return the track object for the track corresponding to this uid
 *
 * Null or undefined if none.
 */
const getTrackByUid = (tracks, uid) => {
  let found = null;

  const checkTrack = (track) => {
    if (track.uid === uid) found = track;
    if (track.type.substr(0, 8) === 'combined')
      track.contents.forEach(checkTrack);
    return null;
  };

  Object.keys(tracks)
    .map((trackType) => tracks[trackType])
    .filter((tracksByPos) => tracksByPos.filter)
    .reduce((a, b) => a.concat(b), [])
    .forEach(checkTrack);

  return found;
};

export default getTrackByUid;
