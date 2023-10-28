// @ts-nocheck
import { DATATYPE_TO_TRACK_TYPE } from './datatype-to-track-type';

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
  let availableTrackTypes = new Set(
    Object.values(datatypesToTrackTypes).flatMap((x) => x),
  );

  for (const datatype of datatypes) {
    // datatype should actually be an array of datatypes
    const dataTypeSet = new Set(datatype);

    availableTrackTypes = new Set(
      [...availableTrackTypes].filter(
        (x) => x.datatype.filter((y) => dataTypeSet.has(y)).length > 0,
      ),
    );
  }

  return [...availableTrackTypes];
};

export default AVAILABLE_TRACK_TYPES;
