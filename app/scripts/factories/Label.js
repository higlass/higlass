import { max, min, toInt } from '../utils';

function Label(id, t = 1.0) {
  this.id = id;
  this.t = t;

  // Between 0 and 1. 0 means there is no penalty for the distance to the origin
  this.locality = 1;

  // Do not cluster element on disconnect
  this.isDisconnected = false;

  return this;
}

/* ------------------------------- Properties ------------------------------- */

function getDataPos() {
  return this.src.getDataPosition();
}

Object.defineProperty(Label.prototype, 'dataPos', { get: getDataPos });

/* --------------------------------- Methods -------------------------------- */

Label.prototype.connect = function connect() {
  this.locality = 1;
  this.isDisconnected = false;
};

Label.prototype.disconnect = function disconnect() {
  this.locality = 0;
  this.isDisconnected = true;
};

Label.prototype.setLocality = function setLocality(locality) {
  this.locality = max(0, min(1, toInt(locality)));
};

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
