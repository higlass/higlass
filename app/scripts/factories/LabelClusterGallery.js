import LabelCluster from './LabelCluster';


function LabelClusterGallery(...args) {
  LabelCluster.call(this, ...args);

  this.isVerticalOnly = false;
  this.isLeftCloser = false;
  this.isTopCloser = false;
}

/* ------------------------------ Inheritance ------------------------------- */

LabelClusterGallery.prototype = Object.create(LabelCluster.prototype);
LabelClusterGallery.prototype.constructor = LabelClusterGallery;

/* ------------------------------- Properties ------------------------------- */

/* --------------------------------- Methods -------------------------------- */

function setLeftCloser(isLeftCloser) {
  this.isLeftCloser = isLeftCloser;
}
LabelClusterGallery.prototype.setLeftCloser = setLeftCloser;

function setXY(x, y) {
  this.x = x;
  this.y = y;
}
LabelClusterGallery.prototype.setXY = setXY;

function setOffSet(x, y) {
  this.offX = x;
  this.offY = y;
}
LabelClusterGallery.prototype.setOffSet = setOffSet;

function setTopCloser(isTopCloser) {
  this.isTopCloser = isTopCloser;
}
LabelClusterGallery.prototype.setTopCloser = setTopCloser;

function setVerticalOnly(isVerticalOnly) {
  this.isVerticalOnly = isVerticalOnly;
}
LabelClusterGallery.prototype.setVerticalOnly = setVerticalOnly;

function updateOrigin() {
  this.oX += this.offX;
  this.oY += this.offY;
}
LabelClusterGallery.prototype.updateOrigin = updateOrigin;

export default LabelClusterGallery;
