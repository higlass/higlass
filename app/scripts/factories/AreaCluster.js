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
  this.bounds = null;

  this.minX = Infinity;
  this.maxX = 0;
  this.minY = Infinity;
  this.maxY = 0;

  // Usually this is the grid size of the clusterer
  this.padding = padding;
}

/* ------------------------------- Properties ------------------------------- */

function getSize() {
  return this.members.size;
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
    const x = ((this.cX * l) + cX) / (l + 1);
    const y = ((this.cY * l) + cY) / (l + 1);
    this.center = [x, y];
  }

  annotation.isAdded = true;
  this.members.add(annotation);

  this.updateBounds(annotation);

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

/**
 * Returns the center of the cluster.
 *
 * @return {google.maps.LatLng} The cluster center.
 */
AreaCluster.prototype.getCenter = function getCenter() {
  return [this.cX, this.cY];
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
 *
 * @param {google.maps.Marker} element The element to check.
 * @return {boolean} True if the element lies in the bounds.
 */
AreaCluster.prototype.isWithin = function isWithin(element, isExtended = false) {
  const [eMinX, eMaxX, eMinY, eMaxY] = element.getViewPosition();
  const padding = isExtended ? this.padding : 0;
  return (
    eMinX < this.maxX + padding &&
    eMaxX > this.minX - padding &&
    eMinY < this.maxY + padding &&
    eMaxY > this.minY - padding
  );
};

export default AreaCluster;
