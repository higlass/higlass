import { InsetCluster } from './';

import { isWithin as _isWithin, lDist } from '../utils';


function AreaClusterer(markers, options) {
  this._markers = new Set();
  this._clusters = new Set();

  this.sizes = [53, 56, 66, 78, 90];

  this._isReady = false;

  const _options = options || {};

  this._gridSize = _options.gridSize || 60;
  this._minClusterSize = _options.minClusterSize || 2;
  this._maxZoom = _options.maxZoom || null;
  this._isAverageCenter = !!options.averageCenter;
  this._prevZoom = null;
  this._minX = 0;
  this._maxX = 0;
  this._minY = 0;
  this._maxY = 0;

  // Finally, add the markers
  this.addMarkers(markers, false);
}

/**
 * Whether average center is set.
 * @return  {boolean}  `true` if _averageCenter is set.
 */
AreaClusterer.prototype.isAverageCenter = () => this._isAverageCenter;

/**
 * Returns the array of markers in the clusterer.
 * @return  {set}  The markers.
 */
AreaClusterer.prototype.getMarkers = () => this._markers;

/**
 * Returns the number of markers in the clusterer
 * @return {number} The number of markers.
 */
AreaClusterer.prototype.getTotalMarkers = () => this._markers.length;

/**
 * Gets the max zoom for the clusterer.
 * @return {number}  The max zoom level.
 */
AreaClusterer.prototype.getMaxZoom = () => this._maxZoom;

/**
 * Sets the max zoom for the clusterer.
 * @param {number}  maxZoom  The max zoom level.
 */
AreaClusterer.prototype.setMaxZoom = (maxZoom) => {
  this._maxZoom = maxZoom;
};

/**
 * Gets the bound for the clusterer.
 * @return  {array}  bounds  Quadrupel of form `[minX, maxX, minY, maxY]`.
 */
AreaClusterer.prototype.getBounds = () => this._bounds;

/**
 * Sets the bounds for the clusterer.
 * @param  {array}  bounds  Quadrupel of form `[minX, maxX, minY, maxY]`.
 */
AreaClusterer.prototype.setBounds = (bounds) => {
  this._bounds = bounds;
};

/**
 * Add an array of markers to the clusterer.
 *
 * @param  {object}  markers - The markers to add.
 * @param  {boolean}  noDraw - If `true` markers are *not* redrawn.
 */
AreaClusterer.prototype.addMarkers = function addMarkers(markers, noDraw) {
  markers.forEach((marker) => {
    this._markers.add(marker);
  });
  if (!noDraw) this.redraw();
};

/**
 * Adds a marker to the clusterer and redraws if needed.
 *
 * @param  {object}  marker - The marker to add.
 * @param  {boolean}  noDraw - If `true` markers are *not* redrawn.
 */
AreaClusterer.prototype.addMarker = function addMarker(marker, noDraw) {
  this._markers.add(marker);
  if (!noDraw) this.redraw();
};

/**
 * Removes a marker and returns true if removed, false if not
 * @param  {object}  marker - The marker to be remove.
 * @return  {boolean}  If `true` marker has been removed.
 */
AreaClusterer.prototype.removeMarker = function removeMarker(marker, noDraw) {
  const isRemoved = this._markers.delete(marker);

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
  if (!this._ready) {
    this._ready = ready;
    this.createClusters();
  }
};

/**
 * Returns the number of clusters in the clusterer.
 * @return  {number}  The number of clusters.
 */
AreaClusterer.prototype.getTotalClusters = function getTotalClusters() {
  return this._clusters.size;
};

/**
 * Returns the size of the grid.
 * @return  {number}  The grid size.
 */
AreaClusterer.prototype.getGridSize = function getGridSize() {
  return this._gridSize;
};

/**
 * Sets the size of the grid.
 * @param  {number}  size - The grid size.
 */
AreaClusterer.prototype.setGridSize = function setGridSize(size) {
  this._gridSize = size;
};

/**
 * Returns the min cluster size.
 * @return  {number}  The grid size.
 */
AreaClusterer.prototype.getMinClusterSize = function getMinClusterSize() {
  return this._minClusterSize;
};

/**
 * Sets the min cluster size.
 * @param  {number}  size - The grid size.
 */
AreaClusterer.prototype.setMinClusterSize = function setMinClusterSize(size) {
  this._minClusterSize = size;
};

/**
 * Extends a bounds object by the grid size.
 * @param  {array}  bounds - Quadruple of form `[minX, maxX, minY, maxY]`.
 * @return  {array}  Extended bounds in form of `[minX, maxX, minY, maxY]`.
 */
AreaClusterer.prototype.getExtendedBounds = function getExtendedBounds(bounds) {
  return [
    bounds[0] - this.gridSize_,
    bounds[1] - this.gridSize_,
    bounds[2] + this.gridSize_,
    bounds[3] + this.gridSize_,
  ];
};

/**
 * Clears all clusters and markers from the clusterer.
 */
AreaClusterer.prototype.clearMarkers = function clearMarkers() {
  this.resetViewport(true);

  // Set the markers a new empty set
  this._markers = new Set();
};

/**
 * Clears all existing clusters and recreates them.
 */
AreaClusterer.prototype.resetViewport = function resetViewport() {
  this._clusters.forEach((cluster) => { cluster.remove(); });
  this._markers.forEach((marker) => { marker.isAdded = false; });

  this._clusters = new Set();
};

/**
 * Repaint
 */
AreaClusterer.prototype.repaint = function repaint() {
  const oldClusters = new Set(this._clusters);

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
  let distance = 40000; // Some large number
  let clusterToAddTo = null;
  const markerCenter = marker.getViewPositionCenter();

  this._clusters.forEach((cluster) => {
    const clusterCenter = cluster.getViewPositionCenter();
    if (clusterCenter) {
      const d = lDist(clusterCenter, markerCenter);
      if (d < distance) {
        distance = d;
        clusterToAddTo = cluster;
      }
    }
  });

  if (clusterToAddTo && clusterToAddTo.isWithin(marker)) {
    clusterToAddTo.addMarker(marker);
  } else {
    const cluster = new InsetCluster(this.isAverageCenter());
    cluster.addMarker(marker);
    this._clusters.add(cluster);
  }
};

/**
 * Creates the clusters.
 */
AreaClusterer.prototype.createClusters = function createClusters() {
  if (!this._ready) return;

  this._markers
    .filter(marker => !marker.isAdded && this.isWithin(marker))
    .forEach((marker) => {
      this.addToClosestCluster(marker);
    });
};

/**
 * Creates the clusters.
 */
AreaClusterer.prototype.isWithin = function isWithin(marker) {
  return _isWithin(
    ...marker.getViewPosition(),
    this._minX, this._maxX, this._minY, this._maxY
  );
};

export default AreaClusterer;
