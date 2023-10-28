import { isCombinedTrackConfig } from './type-guards';

/**
 * Track visitor to run code on individual tracks.
 * @param {import('../types').TrackConfig[]} tracks - List of all tracks from the view definition.
 * @param {import('../types').TrackVisitor} visit - Callback function receiving individual tracks.
 * @param {boolean} includeCombinedTracks - If `true` recursively visit combined tracks.
 * @param {import('../types').TrackPosition | null} position - Can be used to limit the tracks to be visit to a certain position.
 */
const visitTracks = (
  tracks,
  visit,
  includeCombinedTracks = true,
  position = null,
) =>
  tracks.forEach((track) => {
    if (includeCombinedTracks && isCombinedTrackConfig(track)) {
      visitTracks(track.contents, visit, includeCombinedTracks, position);
    }
    visit(track, position);
  });

export default visitTracks;
