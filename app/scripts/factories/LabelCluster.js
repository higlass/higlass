import Label from './Label';

function LabelCluster(id, t = 1.0) {
  Label.call(this, id, t);
}

/* ------------------------------ Inheritance ------------------------------- */

LabelCluster.prototype = Object.create(Label.prototype);
LabelCluster.prototype.constructor = LabelCluster;

/* ------------------------------- Properties ------------------------------- */

function getMinX() {
  return this.src.minX;
}

Object.defineProperty(LabelCluster.prototype, 'minX', { get: getMinX });

function getMaxX() {
  return this.src.maxX;
}

Object.defineProperty(LabelCluster.prototype, 'maxX', { get: getMaxX });

function getMinY() {
  return this.src.minY;
}

Object.defineProperty(LabelCluster.prototype, 'minY', { get: getMinY });

function getMaxY() {
  return this.src.maxY;
}

Object.defineProperty(LabelCluster.prototype, 'maxY', { get: getMaxY });

function getDataPos() {
  return this.src.members.translate(member => member.getDataPosition());
}

Object.defineProperty(LabelCluster.prototype, 'dataPos', { get: getDataPos });

/* --------------------------------- Methods -------------------------------- */

LabelCluster.prototype.compDimPos = function compDimPos() {
  const size = this.src.size;

  // Update centroids
  this.x = this.src.members
    .reduce((sum, member) => sum + member.minX + member.maxX, 0) / (2 * size);
  this.y = this.src.members
    .reduce((sum, member) => sum + member.minY + member.maxY, 0) / (2 * size);
  this.oX = this.x;
  this.oY = this.y;

  // Update width and height halfs of the bounding area of the origin
  this.oWH = (this.maxX - this.minX) / 2;
  this.oHH = (this.maxY - this.minY) / 2;

  return this;
};

LabelCluster.prototype.connect = function connect() {
  Label.prototype.connect.call(this);

  this.src.connect();
};

LabelCluster.prototype.disconnect = function disconnect() {
  Label.prototype.disconnect.call(this);

  this.src.disconnect();
};

LabelCluster.prototype.setDim = function setDim(width, height) {
  this.width = width;
  this.height = height;
  this.wH = width / 2;
  this.hH = height / 2;
  return this;
};

LabelCluster.prototype.setSrc = function setSrc(cluster) {
  this.src = cluster;
  this.compDimPos();
  return this;
};

LabelCluster.prototype.refresh = function refresh() {
  this.src.refresh();

  this.oX = this.src.cX;
  this.oY = this.src.cY;
  this.oWH = (this.maxX - this.minX) / 2;
  this.oHH = (this.maxY - this.minY) / 2;

  return this;
};

export default LabelCluster;
