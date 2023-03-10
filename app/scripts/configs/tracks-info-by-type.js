import { TRACKS_INFO } from './tracks-info';

export const TRACKS_INFO_BY_TYPE = TRACKS_INFO.reduce((tracksByType, track) => {
  tracksByType[track.type] = track;
  if (track.aliases) {
    for (const alias of track.aliases) {
      tracksByType[alias] = track;
    }
  }
  return tracksByType;
}, {});

export default TRACKS_INFO_BY_TYPE;
