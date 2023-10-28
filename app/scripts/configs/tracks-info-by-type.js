import { TRACKS_INFO } from './tracks-info';

/** @typedef {Record<string, import('./tracks-info').TrackInfo>} TracksInfoByType */

export const TRACKS_INFO_BY_TYPE = TRACKS_INFO.reduce((tracksByType, track) => {
  tracksByType[track.type] = track;
  if (track.aliases) {
    for (const alias of track.aliases) {
      tracksByType[alias] = track;
    }
  }
  return tracksByType;
}, /** @type {TracksInfoByType} */ ({}));

export default TRACKS_INFO_BY_TYPE;
