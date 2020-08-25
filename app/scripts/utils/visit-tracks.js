/**
 * Track visitor to run code on individual tracks.
 * @param   {array}  tracks  List of all tracks from the view definition.
 * @param   {function}  visitor  Callback function receiving individual tracks.
 * @param   {boolean}  inclCombinedTracks  If `true` recursively visit combined tracks.
 * @param   {function}  position  Can be used to limit the tracks to be visit to a certain position.
 */
const visitTracks = (
  tracks,
  visitor,
  inclCombinedTracks = true,
  position = null,
) =>
  tracks.forEach((track) => {
    if (track.type === 'combined') {
      if (inclCombinedTracks) {
        visitTracks(track.contents, visitor, inclCombinedTracks, position);
        visitor(track, position);
      }
    } else {
      visitor(track, position);
    }
  });

export default visitTracks;
