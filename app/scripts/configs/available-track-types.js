import { DATATYPE_TO_TRACK_TYPE } from '.';

/**
 * Return a list of the available track types, given a set of data types
 * and an orientation
 *
 * Arguments
 * ---------
 *
 *  datatypes: list
 *      E.g. ['heatmap', 'vector']
 *
 *  orientation: string
 *      E.g. 'top'
 *
 * Return
 * ------
 *
 *  A list of track-types:
 *      E.g. ['top-line', 'top-rectangle']
 */
export const AVAILABLE_TRACK_TYPES = (datatypes, orientation) => {
  const datatypesToTrackTypes = DATATYPE_TO_TRACK_TYPE(orientation);

  const firstDatatype = datatypes[0];
  let allSame = true;
  for (let datatype of datatypes)
    if (datatype != firstDatatype)
      allSame = false;

  if (allSame) {
    // only display available track types if all of the selected datasets are
    // the same
    return datatypesToTrackTypes[datatypes[0]];
  }

  return [];
}

export default AVAILABLE_TRACK_TYPES;
