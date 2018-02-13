function Label(id, width, height, annotation, t = 1.0) {
  this.id = id;

  this.width = width;
  this.height = height;
  this.wH = width / 2;
  this.hH = height / 2;

  this.t = t;

  this.annotation = annotation;

  this.minX = annotation.minX;
  this.maxX = annotation.maxX;
  this.minY = annotation.minY;
  this.maxY = annotation.maxY;

  this.x = (annotation.minX + annotation.maxX) / 2;
  this.y = (annotation.minY + annotation.maxY) / 2;
  this.oX = this.x;
  this.oY = this.y;
  this.oWH = (this.maxX - this.minX) / 2;
  this.oHH = (this.maxY - this.minY) / 2;

  this.dataPos = annotation.getDataPosition();
}

export default Label;
