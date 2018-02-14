import { AreaCluster, KeySet } from './';

import { lDist } from '../utils';


const AreaClusterer = function AreaClusterer(options) {
  this.markers = new KeySet();
  this.markersAddedToClusters = new KeySet();
  this.clusters = new KeySet();

  this.sizes = [53, 56, 66, 78, 90];

  this.isReady = false;

  const _options = options || {};

  this.gridSize = _options.gridSize || 60;
  this.maxZoom = _options.maxZoom || null;
  this.isAverageCenter = !!options.averageCenter || true;
  this.prevZoom = null;
  this.minX = 0;
  this.maxX = 0;
  this.minY = 0;
  this.maxY = 0;
  this.defaultMinDist = _options.defaultMinDist || 40000;

  this.clustersMaxSize = 1;
};

/* ------------------------------- Properties ------------------------------- */

function getSize() {
  return this.clusters.size;
}

Object.defineProperty(AreaClusterer.prototype, 'size', { get: getSize });

/* --------------------------------- Methods -------------------------------- */

/**
 * Returns the number of markers in the clusterer
 * @return {number} The number of markers.
 */
AreaClusterer.prototype.getTotalMarkers = function getTotalMarkers() {
  return this.markers.size;
};

/**
 * Gets the bound for the clusterer.
 * @return  {array}  bounds  Quadrupel of form `[minX, maxX, minY, maxY]`.
 */
AreaClusterer.prototype.getBounds = function getBounds() {
  return [this.minX, this.maxX, this.minY, this.maxY];
};

/**
 * Sets the bounds for the clusterer.
 * @param   {number}  minX  Left most X position.
 * @param   {number}  maxX  Right most X position.
 * @param   {number}  minY  Top most Y position.
 * @param   {number}  maxY  Bottom most Y position.
 */
AreaClusterer.prototype.setBounds = function setBounds(minX, maxX, minY, maxY) {
  this.minX = minX || this.minX;
  this.maxX = maxX || this.maxX;
  this.minY = minY || this.minY;
  this.maxY = maxY || this.maxY;
};

/**
 * Add an array of markers to the clusterer.
 *
 * @param  {object}  markers - The markers to add.
 * @param  {boolean}  noDraw - If `true` markers are *not* redrawn.
 */
AreaClusterer.prototype.addMarkers = function addMarkers(markers, noDraw) {
  markers.forEach((marker) => {
    this.markers.add(marker);
  });

  if (!noDraw) this.redraw();
};

/**
 * Removes a marker and returns true if removed, false if not
 * @param  {object}  marker - The marker to be remove.
 * @return  {boolean}  If `true` marker has been removed.
 */
AreaClusterer.prototype.removeMarkers = function removeMarkers(markers, noDraw) {
  const isRemoved = markers
    .translate(marker => this.markers.delete(marker))
    .some(markerIsRemoved => markerIsRemoved);

  if (isRemoved && !noDraw) {
    this.resetViewport();
    this.redraw();
  }

  return isRemoved;
};

/**
 * Sets the clusterer's ready state.
 * @param  {boolean}  ready - The state.
 */
AreaClusterer.prototype.setReady = function setReady(ready) {
  if (!this.ready) {
    this.ready = ready;
    this.createClusters();
  }
};

/**
 * Returns the number of clusters in the clusterer.
 * @return  {number}  The number of clusters.
 */
AreaClusterer.prototype.getTotalClusters = function getTotalClusters() {
  return this.clusters.size;
};

/**
 * Returns the size of the grid.
 * @return  {number}  The grid size.
 */
AreaClusterer.prototype.getGridSize = function getGridSize() {
  return this.gridSize;
};

/**
 * Sets the size of the grid.
 * @param  {number}  size - The grid size.
 */
AreaClusterer.prototype.setGridSize = function setGridSize(size) {
  this.gridSize = size;
};

/**
 * Extends a bounds object by the grid size.
 * @param  {array}  bounds - Quadruple of form `[minX, maxX, minY, maxY]`.
 * @return  {array}  Extended bounds in form of `[minX, maxX, minY, maxY]`.
 */
AreaClusterer.prototype.getExtendedBounds = function getExtendedBounds(bounds) {
  return [
    bounds[0] - this._gridSize,
    bounds[1] - this._gridSize,
    bounds[2] + this._gridSize,
    bounds[3] + this._gridSize,
  ];
};

/**
 * Clears all clusters and markers from the clusterer.
 */
AreaClusterer.prototype.clearMarkers = function clearMarkers() {
  this.resetViewport(true);

  // Set the markers a new empty set
  this.markers = new KeySet();
  this.markersAddedToClusters = new KeySet();
  this.clusters = new KeySet();
  this.clustersMaxSize = 1;
};

/**
 * Clears all existing clusters and recreates them.
 */
AreaClusterer.prototype.resetViewport = function resetViewport() {
  this.clusters.forEach((cluster) => { cluster.remove(); });

  this.markersAddedToClusters = new KeySet();
  this.clusters = new KeySet();
  this.clustersMaxSize = 1;
};

/**
 * Repaint
 */
AreaClusterer.prototype.repaint = function repaint() {
  const oldClusters = this.clusters.clone();

  this.resetViewport();
  this.redraw();

  // Remove the old clusters.
  // Do it in a timeout so the other clusters have been drawn first.
  window.setTimeout(() => {
    oldClusters.forEach((cluster) => { cluster.remove(); });
  }, 0);
};

/**
 * Redraws the clusters.
 */
AreaClusterer.prototype.redraw = function redraw() {
  this.createClusters();
};

/**
 * Add a marker to a cluster, or creates a new cluster.
 * @param  {object}  marker - The marker to add.
 */
AreaClusterer.prototype.addToClosestCluster = function addToClosestCluster(marker) {
  let distance = this.defaultMinDist;
  let clusterToAddTo = null;
  const markerCenter = marker.getViewPositionCenter();

  this.clusters.forEach((cluster) => {
    const clusterCenter = cluster.getCenter();
    if (clusterCenter) {
      const d = lDist(clusterCenter, markerCenter);
      if (d < distance) {
        distance = d;
        clusterToAddTo = cluster;
      }
    }
  });

  if (clusterToAddTo && clusterToAddTo.isWithin(marker)) {
    clusterToAddTo.add(marker);
    this.clustersMaxSize = clusterToAddTo.size;
  } else {
    const cluster = new AreaCluster(this.isAverageCenter, this.gridSize);
    cluster.add(marker);
    this.clusters.add(cluster);
  }
};

/**
 * Creates the clusters.
 */
AreaClusterer.prototype.createClusters = function createClusters() {
  if (!this.ready) return;

  this.markers.forEach((marker) => {
    if (!this.markersAddedToClusters.has(marker) && this.isWithin(marker)) {
      this.addToClosestCluster(marker);
    }
  });
};

/**
 * Creates the clusters.
 */
AreaClusterer.prototype.isWithin = function isWithin(marker) {
  const [mMinX, mMaxX, mMinY, mMaxY] = marker.getViewPosition();
  return (
    mMinX < this.maxX &&
    mMaxX > this.minX &&
    mMinY < this.maxY &&
    mMaxY > this.minY
  );
};

export default AreaClusterer;
