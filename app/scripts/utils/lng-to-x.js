const lngToX = (lng, zoom) => (2 ** zoom) * (lng + 180.0) / 360.0;

export default lngToX;
