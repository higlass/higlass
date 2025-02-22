import { DEFAULT_TRACKS_FOR_DATATYPE, TRACKS_INFO_BY_TYPE } from '../configs';

/** Get the default tracks for a datatype. Uses the known track definitions as
 * well as any extra definitions that may be passed in. */
export default function getDefaultTracksForDatatype(
  datatype,
  otherDefaultTracks,
) {
  if (window.higlassTracksByType) {
    // Extend `TRACKS_INFO_BY_TYPE` with the configs of plugin tracks.
    Object.keys(window.higlassTracksByType).forEach(pluginTrackType => {
      TRACKS_INFO_BY_TYPE[pluginTrackType] =
        window.higlassTracksByType[pluginTrackType].config;
    });
  }

  if (!(datatype in DEFAULT_TRACKS_FOR_DATATYPE) && !otherDefaultTracks) {
    console.warn('unknown data type:', datatype);
    return undefined;
  }

  const orientationToPositions = {
    '1d-horizontal': ['top', 'bottom', 'left', 'right'],
    '2d': ['center'],
    '1d-vertical': ['left', 'right'],
  };

  const defaultTracks = DEFAULT_TRACKS_FOR_DATATYPE[datatype] || {};

  if (otherDefaultTracks) {
    for (const trackType of otherDefaultTracks) {
      if (!TRACKS_INFO_BY_TYPE[trackType]) {
        console.warn('unknown track type', trackType);
      } else {
        for (const position of orientationToPositions[
          TRACKS_INFO_BY_TYPE[trackType].orientation
        ]) {
          defaultTracks[position] = trackType;
        }
      }
    }
  }

  return defaultTracks;
}
