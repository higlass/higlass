import visitTracks from './visit-tracks';

/** @import { TrackConfig, TrackPosition, TrackVisitor } from '../types' */

/** @typedef {{ [Key in TrackPosition]?: Array<TrackConfig> }} PositionedTracks */

/**
 * Track visitor for positioned tracks, i.e., tracks with a position.
 *
 * @param {PositionedTracks} positionedTracks - List of all positioned tracks from the view definition.
 * @param {TrackVisitor} visitor - Callback function receiving individual tracks.
 * @param {boolean} inclCombinedTracks - If `true` recursively visit combined tracks.
 */
const visitPositionedTracks = (
  positionedTracks,
  visitor,
  inclCombinedTracks = true,
) => {
  /** @type {Array<TrackConfig>} */
  const allTracks = [];

  for (const [stringPosition, tracks] of Object.entries(positionedTracks)) {
    /** @type {TrackPosition} */
    // @ts-expect-error - Typings for Object#entries don't have strong inference,
    // might change in the future.
    const position = stringPosition;
    visitTracks(tracks, visitor, inclCombinedTracks, position);
    allTracks.push(...tracks);
  }

  return allTracks;
};

export default visitPositionedTracks;
