import { tracksInfo } from '.';

export const tracksInfoByType = tracksInfo.reduce(
  (tracksByType, track) => tracksByType[track.type] = track,
  {}
);

export default tracksInfoByType;
