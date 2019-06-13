const visitTracks = (
  tracks, visitor, inclCombinedTracks = true, position = null
) => tracks.forEach((track) => {
  if (track.type === 'combined') {
    if (inclCombinedTracks) {
      visitTracks(track.contents, visitor, inclCombinedTracks, position);
    }
  } else {
    visitor(track, position);
  }
});

export default visitTracks;
