import { TRACKS_INFO } from '.';

export const TRACKS_INFO_BY_TYPE = TRACKS_INFO.reduce(
  (tracksByType, track) => tracksByType[track.type] = track,
  {}
);

export default TRACKS_INFO_BY_TYPE;
