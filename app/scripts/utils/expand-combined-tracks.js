/**
 * Go through a list of tracks and expand combined
 * tracks.
 *
 * @param {list} tracks: A list of tracks some of which might be combined
 * @returns {list} tracks: A list of tracks without combined
 */
const expandCombinedTracks = (trackList) => {
  let newTracks = [];

  for (let i = 0; i < trackList.length; i++) {
    if (trackList[i].contents) {
      newTracks = newTracks.concat(trackList[i].contents);
    } else {
      newTracks.push(trackList[i]);
    }
  }

  return newTracks;
};

export default expandCombinedTracks;
