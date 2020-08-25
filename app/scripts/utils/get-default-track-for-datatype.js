// Configs
import { DEFAULT_TRACKS_FOR_DATATYPE } from '../configs';

/**
 * Gets the default track as defined in utils/default-tracks-for-datatype.js
 *
 * @param  {string} datatype The datatype to get the default track for
 * @param  {string} position   top, bottom, left, right, center
 * @param  {array} availableTracks   list of tracks to choose from,
 * typically obtained from AVAILABLE_TRACK_TYPES(...)
 * @return {object}  an element of availableTracks or undefined
 */
const getDefaultTrackForDatatype = (datatype, position, availableTracks) => {
  if (availableTracks.length === 0) {
    return undefined;
  }

  if (availableTracks.length === 1) {
    return availableTracks[0];
  }

  let usedTrack = availableTracks[0];
  const defaultTrackType =
    DEFAULT_TRACKS_FOR_DATATYPE[datatype] !== undefined
      ? DEFAULT_TRACKS_FOR_DATATYPE[datatype][position]
      : undefined;

  if (defaultTrackType !== undefined) {
    // If we found a default track type for this datatype,
    // get the definition of this track from the list of available tracks.
    usedTrack =
      availableTracks.find((tt) => tt.type === defaultTrackType) || usedTrack;
  }

  return usedTrack;
};

export default getDefaultTrackForDatatype;
