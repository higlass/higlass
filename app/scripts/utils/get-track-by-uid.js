/**
 * Return the track object for the track corresponding to this uid
 *
 * Null or undefined if none.
 */
const getTrackByUid = (tracks, uid) => {
  for (let trackType in tracks) {
    let theseTracks = tracks[trackType];

    let filteredTracks = theseTracks.filter((d) => { return d.uid == uid; });

    if (filteredTracks.length)
      return filteredTracks[0];

    // check to see if this track is part of a combined track
    let combinedTracks = theseTracks.filter((d) => { return d.type == 'combined'; });

    if (combinedTracks.length) {
      for (let i = 0; i < combinedTracks.length; i++) {
        let ct = combinedTracks[i];
        let filteredTracks = ct.contents.filter(d => d.uid == uid);

        if (filteredTracks.length)
          return filteredTracks[0];
      }
    }
  }

  return null;
}

export default getTrackByUid;
