import { TRACKS_INFO } from '.';

export const DATATYPE_TO_TRACK_TYPE = (orientation) => {
  const localDatatypeToTrackType = {};

  // can a track be placed in a given orientation
  const orientationMatches = (trackInfo) => {
    // if the track's orientation matches the given orientation, then yes
    if (trackInfo.orientation === orientation) {
      return true;
    }

    if (
      orientation === '1d-vertical' &&
      trackInfo.orientation === '1d-horizontal' &&
      trackInfo.rotatable
    ) {
      // we can place 1d-horizontal tracks in a vertical position if they are rotatable
      return true;
    }

    return false;
  };

  TRACKS_INFO.filter(orientationMatches).forEach((ti) => {
    let datatypes = ti.datatype;

    if (!Array.isArray(ti.datatype)) {
      datatypes = [datatypes];
    }

    datatypes.forEach((datatype) => {
      if (!(datatype in localDatatypeToTrackType)) {
        localDatatypeToTrackType[datatype] = [];
      }

      localDatatypeToTrackType[datatype].push(ti);
    });
  });

  localDatatypeToTrackType.none = [];

  return localDatatypeToTrackType;
};

export default DATATYPE_TO_TRACK_TYPE;
