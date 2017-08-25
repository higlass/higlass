import { tracksInfo } from '.';

export const datatypeToTrackType = (orientation) => {
  let localDatatypeToTrackType = {};

  tracksInfo
    .filter(x => x.orientation == orientation)
    .forEach(ti => {
      let datatypes = ti.datatype;

      if (!Array.isArray(ti.datatype))
        datatypes = [datatypes];

      datatypes.forEach(datatype => {
        if (!(datatype in localDatatypeToTrackType))
          localDatatypeToTrackType[datatype] = [];


        localDatatypeToTrackType[datatype].push(ti)
      });
    });

  localDatatypeToTrackType['none'] = [];

  return localDatatypeToTrackType;
}

export default datatypeToTrackType;
