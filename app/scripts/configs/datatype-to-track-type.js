import { TRACKS_INFO } from '.';

export const DATATYPE_TO_TRACK_TYPE = (orientation) => {
  const localDatatypeToTrackType = {};

  TRACKS_INFO
    .filter(x => x.orientation === orientation)
    .forEach((ti) => {
      let datatypes = ti.datatype;

      if (!Array.isArray(ti.datatype)) { datatypes = [datatypes]; }

      datatypes.forEach((datatype) => {
        if (!(datatype in localDatatypeToTrackType)) { localDatatypeToTrackType[datatype] = []; }


        localDatatypeToTrackType[datatype].push(ti);
      });
    });

  localDatatypeToTrackType.none = [];

  return localDatatypeToTrackType;
};

export default DATATYPE_TO_TRACK_TYPE;
