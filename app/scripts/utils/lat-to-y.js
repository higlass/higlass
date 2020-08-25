export const invGudermannian = (y) => Math.log(Math.tan((y + Math.PI / 2) / 2));

/**
 * Translate latitude to Y in the Mercator projection
 * @param   {number}  lat  Latitude.
 * @param   {number}  zoom  Zoom level
 * @return  {number}  Y coordinate in the Mercator projection.
 */
const latToY = (lat, zoom) => {
  let latRad = (lat * Math.PI) / 180.0;

  // "map-centric" latitude, in radians:
  latRad = invGudermannian(latRad);

  return (2 ** zoom * (Math.PI - latRad)) / (2 * Math.PI);
};

export default latToY;
