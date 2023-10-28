import CombinedTrack from '../CombinedTrack';

/**
 * @param {import('../types').TrackObject} testTrack
 * @param {import('../types').TrackObject} track
 * @returns {boolean}
 */
const isTrackOrChildTrack = (testTrack, track) => {
  if (track === testTrack) return true;
  if (track instanceof CombinedTrack) {
    return Object.keys(track.createdTracks)
      .map((trackName) => track.createdTracks[trackName])
      .some((createdTrack) => isTrackOrChildTrack(testTrack, createdTrack));
  }
  return false;
};

export default isTrackOrChildTrack;
