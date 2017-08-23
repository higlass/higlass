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
  positionedTracks,
  includeCombinedContents = true
) =>{
  let tracks = positionedTracks;
  let allTracks = [];

  for (let trackType in tracks) {
    let theseTracks = tracks[trackType]

    theseTracks.forEach(x => {
      if (x.type == 'combined') {
        // we don't really deal with nested combined tracks here,
        // but those shouldn't really be used anyway
        if (includeCombinedContents) {
          x.contents.forEach(y => {
            allTracks.push(Object.assign(y, {position: trackType}));
          });
        }
      }

      allTracks.push(Object.assign(x, {position: trackType}));
    });
  }

  return allTracks;
}

export default positionedTracksToAllTracks;
