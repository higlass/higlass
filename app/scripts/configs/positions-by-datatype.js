
import { TRACKS_INFO } from '.';

export const POSITIONS_BY_DATATYPE = TRACKS_INFO.reduce(
  (positionsByDatatype, track) => {
    for (let i = 0; i < track.datatype.length; i++) {
      const datatype = track.datatype[i];

      if (positionsByDatatype[datatype]) {
        positionsByDatatype[datatype].add(track.orientation);
      } else {
        positionsByDatatype[datatype] = new Set();
      }

      return positionsByDatatype;
    }
  },
  {}
);

export default TRACKS_INFO_BY_TYPE;
