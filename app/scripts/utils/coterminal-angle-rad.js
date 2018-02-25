const coterminalAngleRad = (rad, isNeg = false) => rad - ((1 - (!!isNeg * 2)) * 2 * Math.PI);

export default coterminalAngleRad;
