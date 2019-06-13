/**
 * Convert the position indexed list of tracks:
 *
 * { 'top': [{line}, {bar}],
 *   'center': [{combined, contents: {heatmap, 2d-tiles}]
 *   ...
 *  }
 *
 *  To a flat list of tracks:
 *  { line, position: 'top'
 *   bar, position: 'top'
 *   ...
 *   }
 */
const positionedTracksToAllTracks = (
  positionedTracks, inclCombinedTracks = true
) => {
  const allTracks = [];

  Object.keys(positionedTracks).forEach((position) => {
    positionedTracks[position].forEach((track) => {
      if (track.type === 'combined') {
        // we don't really deal with nested combined tracks here,
        // but those shouldn't really be used anyway
        if (inclCombinedTracks) {
          track.contents.forEach((y) => {
            allTracks.push(Object.assign(y, { position }));
          });
        }
      }

      allTracks.push(Object.assign(track, { position }));
    });
  });

  return allTracks;
};

export default positionedTracksToAllTracks;
