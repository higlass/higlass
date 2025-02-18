// Configs
import { DEFAULT_TRACKS_FOR_DATATYPE } from '../configs';

/** @typedef {typeof DEFAULT_TRACKS_FOR_DATATYPE} DataTypeMapping */
/** @typedef {keyof DataTypeMapping} DataType */
/** @typedef {"top" | "bottom" | "left" | "right" | "center"} TrackPosition */

/**
 * @template {string} D
 * @template {string} P
 * @typedef {D extends DataType ? P extends keyof DataTypeMapping[D] ? DataTypeMapping[D][P] : undefined : undefined} ExtractDataType
 */

/**
 * @template {DataType | string & {}} D
 * @template {TrackPosition} P
 *
 * @param {D} datatype
 * @param {P} position
 * @returns {ExtractDataType<D, P>}
 */
function findDefaultTrackType(datatype, position) {
  // @ts-expect-error - ok with undefined check
  return DEFAULT_TRACKS_FOR_DATATYPE[datatype] !== undefined
    ? // @ts-expect-error - ok with undefined check
      DEFAULT_TRACKS_FOR_DATATYPE[datatype][position]
    : undefined;
}

/**
 * Gets the default track as defined in utils/default-tracks-for-datatype.js
 *
 * @template {DataType | string & {}} D
 * @template {TrackPosition} P
 * @template {ReadonlyArray<{ type: string }>} ATracks
 *
 * @param  {D} datatype - The datatype to get the default track for
 * @param  {P} position - top, bottom, left, right, center
 * @param  {ATracks} availableTracks - List of tracks to choose from, typically obtained from AVAILABLE_TRACK_TYPES(...)
 * @return {ATracks[number] | undefined} An element of availableTracks or undefined
 */
const getDefaultTrackForDatatype = (datatype, position, availableTracks) => {
  if (availableTracks.length === 0) {
    return undefined;
  }

  if (availableTracks.length === 1) {
    return availableTracks[0];
  }

  let usedTrack = availableTracks[0];

  const defaultTrackType = findDefaultTrackType(datatype, position);

  if (defaultTrackType !== undefined) {
    // If we found a default track type for this datatype,
    // get the definition of this track from the list of available tracks.
    usedTrack =
      availableTracks.find((tt) => tt.type === defaultTrackType) || usedTrack;
  }

  return usedTrack;
};

export default getDefaultTrackForDatatype;
