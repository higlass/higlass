/**
 * Convert longitude to the X coordinate in the Mercator projection.
 * @param {number} lng - Longitude
 * @param {number} zoom - Zoom level
 * @return {number} X coordinate in the Mercator projection.
 */
const lngToX = (lng, zoom) => (2 ** zoom * (lng + 180.0)) / 360.0;

export default lngToX;
