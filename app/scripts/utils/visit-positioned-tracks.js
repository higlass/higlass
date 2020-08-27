import visitTracks from './visit-tracks';

/**
 * Track visitor for positioned tracks, i.e., tracks with a position.
 * @param   {array}  tracks  List of all positioned tracks from the view definition.
 * @param   {function}  visitor  Callback function receiving individual tracks.
 * @param   {boolean}  inclCombinedTracks  If `true` recursively visit combined tracks.
 */
const visitPositionedTracks = (
  positionedTracks,
  visitor,
  inclCombinedTracks = true,
) => {
  const allTracks = [];

  Object.keys(positionedTracks).forEach((position) => {
    visitTracks(
      positionedTracks[position],
      visitor,
      inclCombinedTracks,
      position,
    );
  });

  return allTracks;
};

export default visitPositionedTracks;
