import visitTracks from './visit-tracks';

/** @typedef {{ [Key in import('../types').TrackPosition]: import('../types').TrackConfig[] }} PositionedTracks
 */

/**
 * Track visitor for positioned tracks, i.e., tracks with a position.
 * @param {PositionedTracks} positionedTracks - List of all positioned tracks from the view definition.
 * @param {import('../types').TrackVisitor} visitor - Callback function receiving individual tracks.
 * @param {boolean} inclCombinedTracks - If `true` recursively visit combined tracks.
 */
const visitPositionedTracks = (
  positionedTracks,
  visitor,
  inclCombinedTracks = true,
) => {
  /** @type {import('../types').TrackConfig[]} */
  const allTracks = [];

  for (const [stringPosition, tracks] of Object.entries(positionedTracks)) {
    /** @type {import('../types').TrackPosition} */
    // @ts-expect-error - Typings for Object#entries don't have strong inference,
    // might change in the future.
    const position = stringPosition;
    visitTracks(tracks, visitor, inclCombinedTracks, position);
    allTracks.push(...tracks);
  }

  return allTracks;
};

export default visitPositionedTracks;
