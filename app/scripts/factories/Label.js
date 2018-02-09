function Label(id, width, height, annotations = [], t = 1.0) {
  this.id = id;

  this.width = width;
  this.height = height;
  this.wH = width / 2;
  this.hH = height / 2;

  this.t = t;

  this.setAnnotations(annotations);
}

Label.prototype.setAnnotations = function setAnnotations(annotations) {
  this.annotations = new Set(annotations);

  let x = 0;
  let y = 0;

  this.minX = Infinity;
  this.maxX = -Infinity;
  this.minY = Infinity;
  this.maxY = -Infinity;

  this.annotations.forEach((annotation) => {
    x += annotation.minX + annotation.maxX;
    y += annotation.minY + annotation.maxY;

    this.minX = Math.min(this.minX, annotation.minX);
    this.maxX = Math.max(this.maxX, annotation.maxX);
    this.minY = Math.min(this.minY, annotation.minY);
    this.maxY = Math.max(this.maxY, annotation.maxY);
  });

  this.x = x / (this.annotations.size * 2);
  this.y = y / (this.annotations.size * 2);
  this.oX = this.x;
  this.oY = this.y;
  this.oWH = (this.maxX - this.minX) / 2;
  this.oHH = (this.maxY - this.minY) / 2;
};

Label.prototype.getDataPositions = function getDataPositions() {
  const dataPositions = [];
  this.annotations.forEach((annotation) => {
    dataPositions.push(annotation.getDataPosition());
  });
  return dataPositions;
};

export default Label;
