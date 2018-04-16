/**
 * Compute the coterminal angle to an angle in radiance
 * @param   {number}  rad  Source angle in radiance.
 * @param   {boolean}  isNeg  If `true` compute the angle rotated in the
 *   opposite direction, i.e., the radiance will be negative.
 * @return  {number}  Coterminal angle.
 */
const coterminalAngleRad = (rad, isNeg = false) => rad - ((1 - (!!isNeg * 2)) * 2 * Math.PI);

export default coterminalAngleRad;
