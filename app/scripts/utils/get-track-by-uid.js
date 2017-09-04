/**
 * Return the track object for the track corresponding to this uid
 *
 * Null or undefined if none.
 */
const getTrackByUid = (tracks, uid) => {
  for (const trackType in tracks) {
    const theseTracks = tracks[trackType];

    const filteredTracks = theseTracks.filter(d => d.uid == uid);

    if (filteredTracks.length) { return filteredTracks[0]; }

    // check to see if this track is part of a combined track
    const combinedTracks = theseTracks.filter(d => d.type == 'combined');

    if (combinedTracks.length) {
      for (let i = 0; i < combinedTracks.length; i++) {
        const ct = combinedTracks[i];
        const filteredTracks = ct.contents.filter(d => d.uid == uid);

        if (filteredTracks.length) { return filteredTracks[0]; }
      }
    }
  }

  return null;
};

export default getTrackByUid;
