function Label(id, t = 1.0) {
  this.id = id;
  this.t = t;
  return this;
}

/* ------------------------------- Properties ------------------------------- */

function getDataPos() {
  return this.src.getDataPosition();
}

Object.defineProperty(Label.prototype, 'dataPos', { get: getDataPos });

/* --------------------------------- Methods -------------------------------- */

Label.prototype.setSrc = function setSrc(src) {
  this.src = src;

  this.minX = src.minX;
  this.maxX = src.maxX;
  this.minY = src.minY;
  this.maxY = src.maxY;

  this.x = (src.minX + src.maxX) / 2;
  this.y = (src.minY + src.maxY) / 2;
  this.oX = this.x;
  this.oY = this.y;
  this.oWH = (this.maxX - this.minX) / 2;
  this.oHH = (this.maxY - this.minY) / 2;

  return this;
};

Label.prototype.setDim = function setDim(width, height) {
  this.width = width;
  this.height = height;
  this.wH = width / 2;
  this.hH = height / 2;

  return this;
};

export default Label;
