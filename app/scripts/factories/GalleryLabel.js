import Label from './Label';


function GalleryLabel(...args) {
  Label.call(this, ...args);

  this.isVerticalOnly = false;
  this.isLeftCloser = false;
  this.isTopCloser = false;
}

// Extend from Label
GalleryLabel.prototype = Object.create(Label.prototype);
GalleryLabel.prototype.constructor = GalleryLabel;

GalleryLabel.prototype.setLeftCloser = function setLeftCloser(isLeftCloser) {
  this.isLeftCloser = isLeftCloser;
};

GalleryLabel.prototype.setXY = function setXY(x, y) {
  this.x = x;
  this.y = y;
};

GalleryLabel.prototype.setOffSet = function setOffSet(x, y) {
  this.offX = x;
  this.offY = y;
};

GalleryLabel.prototype.setTopCloser = function setTopCloser(isTopCloser) {
  this.isTopCloser = isTopCloser;
};

GalleryLabel.prototype.setVerticalOnly = function setVerticalOnly(isVerticalOnly) {
  this.isVerticalOnly = isVerticalOnly;
};

GalleryLabel.prototype.updateOrigin = function updateOrigin() {
  this.oX += this.offX;
  this.oY += this.offY;
};

export default GalleryLabel;
