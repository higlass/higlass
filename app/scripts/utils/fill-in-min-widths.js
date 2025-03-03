import {
  MIN_HORIZONTAL_HEIGHT,
  MIN_VERTICAL_WIDTH,
  TRACKS_INFO_BY_TYPE,
} from '../configs';

/** @import * as t from '../types' */

/**
 * @typedef CompleteTracks
 * @property {Array<t.TrackConfig>} center
 * @property {Array<t.TrackConfig>} left
 * @property {Array<t.TrackConfig>} right
 * @property {Array<t.TrackConfig>} top
 * @property {Array<t.TrackConfig>} bottom
 * @property {Array<t.TrackConfig>} whole
 * @property {Array<t.TrackConfig>} gallery
 */

/**
 * @template {t.TrackPosition} K
 * @template {Array<t.TrackConfig>} T
 * @typedef {Array<T[number] & { width: number }>} WithMinWidth
 */

/**
 * If tracks don't have specified dimensions, add in the known minimums
 *
 * WARNING: Mutates `tracks` argument
 *
 * @template {Partial<CompleteTracks>} T
 * @param {T} tracks
 * @returns {{
 *  [K in t.TrackPosition]: K extends keyof T ? T[K] extends undefined ? Array<t.TrackConfig> : T[K] : Array<t.TrackConfig>
 * }}
 *
 * Operates on the tracks stored for this TiledPlot.
 */
const fillInMinWidths = (tracks) => {
  // biome-ignore format: nicer to have as one line
  const horizontalLocations = /** @type {const} */ (['top', 'bottom', 'gallery']);
  const verticalLocations = /** @type {const} */ (['left', 'right', 'gallery']);

  // first make sure all track types are specified
  // this will make the code later on simpler
  tracks.center ??= [];
  tracks.left ??= [];
  tracks.right ??= [];
  tracks.top ??= [];
  tracks.bottom ??= [];
  tracks.whole ??= [];
  tracks.gallery ??= [];

  horizontalLocations
    .map((horizontalLocation) => tracks[horizontalLocation])
    .forEach((horizontalTracks) =>
      (horizontalTracks ?? []).forEach((track) => {
        const trackInfo = TRACKS_INFO_BY_TYPE[track.type];
        const defaultOptions = trackInfo?.defaultOptions || {};
        const options = track.options
          ? { ...defaultOptions, ...track.options } // values in track.options take precedence
          : defaultOptions;

        if (options.minHeight !== undefined && track.height === undefined) {
          // @ts-expect-error - minHeight could be anything that's not undefined
          track.height = options.minHeight;
        }

        if (track.height === undefined) {
          track.height = trackInfo?.defaultHeight || MIN_HORIZONTAL_HEIGHT;
        }
      }),
    );

  verticalLocations
    .map((verticalLocation) => tracks[verticalLocation])
    .forEach((verticalTracks) =>
      (verticalTracks ?? []).forEach((track) => {
        const trackInfo = TRACKS_INFO_BY_TYPE[track.type];
        const defaultOptions = trackInfo?.defaultOptions || {};

        const options = track.options
          ? { ...defaultOptions, ...track.options } // values in track.options take precedence
          : defaultOptions;

        if (options.minWidth !== undefined && track.width === undefined) {
          // @ts-expect-error - minWidth could be anything that's not undefined
          track.width = options.minWidth;
        }

        if (track.width === undefined) {
          track.width = trackInfo?.defaultWidth || MIN_VERTICAL_WIDTH;
        }
      }),
    );

  // @ts-expect-error - TS cannot infer that we have made the type correctly
  return tracks;
};

export default fillInMinWidths;
