// @ts-nocheck
// Configs
import {
  MIN_HORIZONTAL_HEIGHT,
  MIN_VERTICAL_WIDTH,
  TRACKS_INFO_BY_TYPE,
} from '../configs';

/**
 * If tracks don't have specified dimensions, add in the known
 * minimums
 *
 * Operates on the tracks stored for this TiledPlot.
 */
const fillInMinWidths = (tracks) => {
  const horizontalLocations = ['top', 'bottom', 'gallery'];
  const verticalLocations = ['left', 'right', 'gallery'];

  // first make sure all track types are specified
  // this will make the code later on simpler
  tracks.center = tracks.center || [];
  tracks.left = tracks.left || [];
  tracks.right = tracks.right || [];
  tracks.top = tracks.top || [];
  tracks.bottom = tracks.bottom || [];
  tracks.whole = tracks.whole || [];
  tracks.gallery = tracks.gallery || [];

  horizontalLocations
    .map((horizontalLocation) => tracks[horizontalLocation])
    .forEach((horizontalTracks) =>
      horizontalTracks.forEach((track) => {
        const trackInfo = TRACKS_INFO_BY_TYPE[track.type];
        const defaultOptions = (trackInfo && trackInfo.defaultOptions) || {};
        const options = track.options
          ? { ...defaultOptions, ...track.options } // values in track.options take precedence
          : defaultOptions;

        if (options.minHeight !== undefined && track.height === undefined) {
          track.height = options.minHeight;
        }

        if (track.height === undefined) {
          track.height =
            (trackInfo && trackInfo.defaultHeight) || MIN_HORIZONTAL_HEIGHT;
        }
      }),
    );

  verticalLocations
    .map((verticalLocation) => tracks[verticalLocation])
    .forEach((verticalTracks) =>
      verticalTracks.forEach((track) => {
        const trackInfo = TRACKS_INFO_BY_TYPE[track.type];
        const defaultOptions = (trackInfo && trackInfo.defaultOptions) || {};

        const options = track.options
          ? { ...defaultOptions, ...track.options } // values in track.options take precedence
          : defaultOptions;

        if (options.minWidth !== undefined && track.width === undefined) {
          track.width = options.minWidth;
        }

        if (track.width === undefined) {
          track.width =
            (trackInfo && trackInfo.defaultWidth) || MIN_VERTICAL_WIDTH;
        }
      }),
    );

  return tracks;
};

export default fillInMinWidths;
