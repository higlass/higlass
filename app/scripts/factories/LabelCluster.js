import Label from './Label';

// import { sum } from '../utils';

function LabelCluster(id, t = 1.0) {
  Label.call(this, id, t);
}

/* ------------------------------ Inheritance ------------------------------- */

LabelCluster.prototype = Object.create(Label.prototype);
LabelCluster.prototype.constructor = LabelCluster;

/* ------------------------------- Properties ------------------------------- */

function getDataPos() {
  return this.src.members.translate(member => member.getDataPosition());
}

Object.defineProperty(LabelCluster.prototype, 'dataPos', { get: getDataPos });

/* --------------------------------- Methods -------------------------------- */

LabelCluster.prototype.compDimPos = function compDimPos() {
  const size = this.src.size;

  // Update centroids
  this.x = this.src.members.reduce((sum, member) => sum + member.minX + member.maxX, 0) / 2 * size;
  this.y = this.src.members.reduce((sum, member) => sum + member.minY + member.maxY, 0) / 2 * size;
  this.oX = this.x;
  this.oY = this.y;

  // Update bounding area of the origins
  this.minX = this.src.members.reduce((a, member) => Math.min(a, member.minX), Infinity);
  this.maxX = this.src.members.reduce((a, member) => Math.max(a, member.maxX), -Infinity);
  this.minY = this.src.members.reduce((a, member) => Math.min(a, member.minY), Infinity);
  this.maxY = this.src.members.reduce((a, member) => Math.max(a, member.maxY), -Infinity);

  // Update width and height halfs of the bounding area of the origin
  this.oWH = (this.maxX - this.minX) / 2;
  this.oHH = (this.maxY - this.minY) / 2;

  return this;
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

export default LabelCluster;
