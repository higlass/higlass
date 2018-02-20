import { KeySet } from './';

const rndHex = () => Math.floor((1 + Math.random()) * 0x10000000).toString(16);

/**
 * A cluster that contains annotations.
 *
 * @param {MarkerClusterer} markerClusterer The markerclusterer that this
 *     cluster is associated with.
 * @constructor
 * @ignore
 */
function AreaCluster(isAverageCenter = true, padding = 0) {
  this.id = rndHex();
  this.isAverageCenter = isAverageCenter;
  this.cX = null;
  this.cY = null;
  this.members = new KeySet('id');
  this.visibleMembers = new KeySet('id');

  this.minX = Infinity;
  this.maxX = 0;
  this.minY = Infinity;
  this.maxY = 0;

  // Usually this is the grid size of the clusterer
  this.padding = padding;
}

/* ------------------------------- Properties ------------------------------- */

function getBounds() {
  return [this.minX, this.maxX, this.minY, this.maxY];
}

Object.defineProperty(AreaCluster.prototype, 'bounds', { get: getBounds });

function getCenter() {
  return [this.cX, this.cY];
}

Object.defineProperty(AreaCluster.prototype, 'center', { get: getCenter });

function getSize() {
  return this.visibleMembers.size;
}

Object.defineProperty(AreaCluster.prototype, 'size', { get: getSize });

/* --------------------------------- Methods -------------------------------- */

/**
 * Add an annotation to the cluster.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @return {boolean} True if the marker was added.
 */
AreaCluster.prototype.add = function add(annotation) {
  if (this.members.has(annotation)) return false;

  const [cX, cY] = annotation.getViewPositionCenter();

  if (!this.cX || !this.cY) {
    this.cX = cX;
    this.cY = cY;
  }

  const l = this.members.size;

  if (this.isAverageCenter) {
    this.cX = ((this.cX * l) + cX) / (l + 1);
    this.cY = ((this.cY * l) + cY) / (l + 1);
  }

  annotation.cluster = this;
  this.members.add(annotation);
  this.visibleMembers.add(annotation);

  this.updateBounds(annotation);

  return true;
};

AreaCluster.prototype.delete = function deleteMethod(annotation) {
  if (!this.members.has(annotation)) return false;

  annotation.cluster = undefined;
  this.members.delete(annotation);
  this.visibleMembers.delete(annotation);

  this.refresh();

  return true;
};

AreaCluster.prototype.hide = function hide(annotation) {
  if (annotation) {
    if (!this.visibleMembers.has(annotation)) return false;

    this.visibleMembers.delete(annotation);

    return true;
  }

  this.isHidden = true;
  return true;
};

AreaCluster.prototype.show = function show(annotation) {
  if (annotation) {
    if (this.visibleMembers.has(annotation)) return false;

    this.visibleMembers.add(annotation);

    return true;
  }

  this.isHidden = false;
  return true;
};

AreaCluster.prototype.getAvgDataProjPos = function getAvgDataProjPos() {
  return [
    this.members.reduce((sum, member) => sum + member.minXDataProj, 0),
    this.members.reduce((sum, member) => sum + member.maxXDataProj, 0),
    this.members.reduce((sum, member) => sum + member.minYDataProj, 0),
    this.members.reduce((sum, member) => sum + member.maxYDataProj, 0),
  ];
};

/**
 * Returns the bounds of the cluster.
 *
 * @return {google.maps.LatLngBounds} the cluster bounds.
 */
AreaCluster.prototype.updateBounds = function updateBounds(area) {
  this.minX = Math.min(this.minX, area.minX);
  this.maxX = Math.max(this.maxX, area.maxX);
  this.minY = Math.min(this.minY, area.minY);
  this.maxY = Math.max(this.maxY, area.maxY);
};

/**
 * Removes the cluster
 */
AreaCluster.prototype.remove = function remove() {
  this.members = new KeySet('id');
};

AreaCluster.prototype.refresh = function refresh() {
  this.minX = Infinity;
  this.maxX = 0;
  this.minY = Infinity;
  this.maxY = 0;

  this.members.forEach((member) => {
    this.updateBounds(member);
  });

  this.cX = (this.minX + this.maxX) / 2;
  this.cY = (this.minY + this.maxY) / 2;
};

/**
 * Determines if an element lies in the clusters bounds.
 * @param  {array}  viewPos  View bounds of the element in pixel in form of
 *   `[fromX, toX, fromY, toY]`
 * @return {boolean}  True if the element lies in the bounds.
 */
AreaCluster.prototype.isWithin = function isWithin(viewPos, isExtended = false) {
  const [eMinX, eMaxX, eMinY, eMaxY] = viewPos;
  const padding = isExtended ? this.padding : 0;
  return (
    eMinX < this.maxX + padding &&
    eMaxX > this.minX - padding &&
    eMinY < this.maxY + padding &&
    eMaxY > this.minY - padding
  );
};

export default AreaCluster;
