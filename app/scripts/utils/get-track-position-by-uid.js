import positionedTracksToAllTracks from './positioned-tracks-to-all-tracks';

/**
 * Get a track's orientation by it's UID.
 */
const getTrackPositionByUid = (allTracks, uid) => {
  const tracks = positionedTracksToAllTracks(allTracks);
  const thisTrack = tracks.filter(x => x.uid == uid);

  return thisTrack[0].position;
};

export default getTrackPositionByUid;
