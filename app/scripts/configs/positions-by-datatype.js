import { TRACKS_INFO } from './tracks-info';

export const POSITIONS_BY_DATATYPE = TRACKS_INFO.reduce(
  (positionsByDatatype, track) => {
    // TODO: Found by eslint. This loop never iterates?
    /* eslint-disable-next-line no-unreachable-loop */
    for (let i = 0; i < track.datatype.length; i++) {
      const datatype = track.datatype[i];

      if (positionsByDatatype[datatype]) {
        positionsByDatatype[datatype].add(track.orientation);
      } else {
        positionsByDatatype[datatype] = new Set();
      }

      return positionsByDatatype;
    }

    return {};
  },
  {},
);

export default POSITIONS_BY_DATATYPE;
