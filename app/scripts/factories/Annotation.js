function Annotation(id, viewPos, dataPos, dataPosProj, importance) {
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

  this.minXDataProj = dataPosProj[0];
  this.maxXDataProj = dataPosProj[1];
  this.minYDataProj = dataPosProj[2];
  this.maxYDataProj = dataPosProj[3];

  this.importance = importance || (
    (dataPos[1] - dataPos[0]) * (dataPos[3] - dataPos[2])
  );
}

/* ------------------------------- Properties ------------------------------- */

function getCenter() {
  return [
    this.cX,
    this.cY,
  ];
}

Object.defineProperty(Annotation.prototype, 'center', { get: getCenter });

function getViewPos() {
  return [
    this.minX,
    this.maxX,
    this.minY,
    this.maxY,
  ];
}

Object.defineProperty(Annotation.prototype, 'viewPos', { get: getViewPos });

/* --------------------------------- Methods -------------------------------- */

Annotation.prototype.getViewPosition = getViewPos;

Annotation.prototype.setViewPosition = function setViewPosition([minX, maxX, minY, maxY]) {
  this.minX = minX;
  this.maxX = maxX;
  this.minY = minY;
  this.maxY = maxY;

  this.cX = (this.maxX + this.minX) / 2;
  this.cY = (this.maxY + this.minY) / 2;
};

Annotation.prototype.getViewPositionCenter = function getViewPositionCenter() {
  return [
    this.cX,
    this.cY,
  ];
};

Annotation.prototype.getDataPosition = function getDataPosition() {
  return [
    this.minXData,
    this.maxXData,
    this.minYData,
    this.maxYData,
  ];
};

Annotation.prototype.getImportance = function getImportance() {
  return this.importance;
};

Annotation.prototype.setImportance = function setImportance(importance) {
  this.importance = importance;
};

export default Annotation;
