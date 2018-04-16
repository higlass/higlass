/**
 * Annotation class. An annotation describes a marked-up 2D region
 * @param  {string}  id  Identifier, usually a UUID.
 * @param  {array}  viewPos  View coordinates in pixels
 * @param  {array}  dataPos  Data coordinates in the original coord system.
 * @param  {array}  dataPosProj  Projected data coordinates. E.g., longitude
 *   and latitude are translated into Mercator projections.
 * @param  {number}  importance  Some importance score.
 * @param  {object}  info  Object holding information about the annotation
 * @param  {string}  typeProp  Property if `info` holding the annotation type.
 */
function Annotation(
  id, viewPos, dataPos, dataPosProj, importance, info = {}, typeProp
) {
  this.id = id;

  this.minX = viewPos[0];
  this.maxX = viewPos[1];
  this.minY = viewPos[2];
  this.maxY = viewPos[3];

  this.cX = (this.maxX + this.minX) / 2;
  this.cY = (this.maxY + this.minY) / 2;

  this.minXData = dataPos[0];
  this.maxXData = dataPos[1];
  this.minYData = dataPos[2];
  this.maxYData = dataPos[3];

  this.dCX = (this.maxXData + this.minXData) / 2;
  this.dCY = (this.maxYData + this.minYData) / 2;

  this.minXDataProj = dataPosProj[0];
  this.maxXDataProj = dataPosProj[1];
  this.minYDataProj = dataPosProj[2];
  this.maxYDataProj = dataPosProj[3];

  // By default the size of the annotation defines its importance
  this.importance = importance || (
    (dataPos[1] - dataPos[0]) * (dataPos[3] - dataPos[2])
  );

  this.info = info;
  this.type = this.info[typeProp] || 'default';
}

/* ------------------------------- Properties ------------------------------- */

/**
 * Get the center of the view position in pixel
 * @return  {array}  Center of the view position in pixel.
 */
function getCenter() {
  return [this.cX, this.cY];
}
Object.defineProperty(Annotation.prototype, 'center', { get: getCenter });

/**
 * Get the center of the data position.
 * @return  {array}  Center of the data position.
 */
function getDataCenter() {
  return [this.dCX, this.dCY];
}
Object.defineProperty(Annotation.prototype, 'dataCenter', { get: getDataCenter });

/**
 * Get the data position
 * @return  {array}  Data position.
 */
function getDataPosition() {
  return [this.minXData, this.maxXData, this.minYData, this.maxYData];
}
Object.defineProperty(Annotation.prototype, 'dataPos', { get: getDataPosition });

/**
 * get the view position in pixels
 * @return  {array}  View position
 */
function getViewPos() {
  return [this.minX, this.maxX, this.minY, this.maxY];
}
Object.defineProperty(Annotation.prototype, 'viewPos', { get: getViewPos });

/* --------------------------------- Methods -------------------------------- */

/**
 * Set the view position in pixels
 * @param  {array}  viewPos  Quadruple of form `[minX, maxX, minY, maxY]`.
 */
function setViewPosition(viewPos) {
  this.minX = viewPos[0];
  this.maxX = viewPos[1];
  this.minY = viewPos[2];
  this.maxY = viewPos[3];

  this.cX = (this.maxX + this.minX) / 2;
  this.cY = (this.maxY + this.minY) / 2;
}

/**
 * Set importance score of annotation
 * @param  {number}  importance  Some number. The higher the more important
 *   the annotation is.
 */
function setImportance(importance) {
  this.importance = importance;
}

Object.assign(Annotation.prototype, {
  setViewPosition,
  getDataPosition,
  setImportance
});

export default Annotation;
