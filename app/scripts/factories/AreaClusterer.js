import { AreaCluster, KeySet } from './';

import { lDist } from '../utils';


const AreaClusterer = function AreaClusterer(options = {}) {
  this.elements = new KeySet();
  this.elementsAddedToClusters = new KeySet();
  this.clusters = new KeySet();

  this.gridSize = options.gridSize || 60;
  this.maxZoom = options.maxZoom || null;
  this.isAverageCenter = !!options.averageCenter || true;
  this.defaultMinDist = options.defaultMinDist || 40000;

  this.prevZoom = null;
  this.minX = 0;
  this.maxX = 0;
  this.minY = 0;
  this.maxY = 0;

  this.clustersMaxSize = 1;
};

/* ------------------------------- Properties ------------------------------- */

function getSize() {
  return this.clusters.size;
}

Object.defineProperty(AreaClusterer.prototype, 'size', { get: getSize });

/* --------------------------------- Methods -------------------------------- */

/**
 * Add an array of elements to the clusterer.
 *
 * @param  {object}  elements - The elements to be added.
 * @param  {boolean}  noDraw - If `true` markers are *not* redrawn.
 */
AreaClusterer.prototype.add = function add(elements, noDraw) {
  elements.forEach((element) => {
    this.elements.add(element);
  });

  if (!noDraw) this.clusterElements();
};

/**
 * Add an element to the clostest cluster, or creates a new cluster.
 * @param  {object}  element - The element to be added.
 */
AreaClusterer.prototype.addToClosestCluster = function addToClosestCluster(element) {
  let distance = this.defaultMinDist;
  let closestCluster = null;
  const elementCenter = element.getViewPositionCenter();

  this.clusters.forEach((cluster) => {
    const clusterCenter = cluster.center;
    if (clusterCenter) {
      const d = lDist(clusterCenter, elementCenter);
      if (d < distance) {
        distance = d;
        closestCluster = cluster;
      }
    }
  });

  if (closestCluster && closestCluster.isWithin(element.viewPos, true)) {
    this.expandCluster(closestCluster, element);
  } else {
    this.createCluster(element);
  }
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
 * Remove all clusters and elements from the clusterer.
 */
AreaClusterer.prototype.clear = function clear() {
  this.resetClusters(true);

  // Set the markers a new empty set
  this.elements = new KeySet();
  this.elementsAddedToClusters = new KeySet();
  this.clusters = new KeySet();
  this.clustersMaxSize = 1;
};

/**
 * Assign each element to a cluster or create a new cluster
 */
AreaClusterer.prototype.clusterElements = function clusterElements() {
  this.elements.forEach((element) => {
    if (
      !this.elementsAddedToClusters.has(element) &&
      this.isWithin(element.viewPos, true)
    ) {
      this.addToClosestCluster(element);
    }
  });
};

/**
 * Create a new the clusters.
 */
AreaClusterer.prototype.createCluster = function createCluster(element) {
  const cluster = new AreaCluster(this.isAverageCenter, this.gridSize);
  cluster.add(element);
  this.elementsAddedToClusters.add(element);
  this.clusters.add(cluster);
};

/**
 * Add an element to an existing cluster
 */
AreaClusterer.prototype.expandCluster = function expandCluster(cluster, element) {
  cluster.add(element);
  this.clustersMaxSize = cluster.size;
  this.elementsAddedToClusters.add(element);
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
 * Check if an element is within the bounds of this clusterer
 */
AreaClusterer.prototype.isWithin = function isWithin(
  viewPos, isExtended = false
) {
  const [mMinX, mMaxX, mMinY, mMaxY] = viewPos;
  const padding = isExtended ? this.gridSize : 0;
  return (
    mMinX < this.maxX + padding &&
    mMaxX > this.minX - padding &&
    mMinY < this.maxY + padding &&
    mMaxY > this.minY - padding
  );
};

AreaClusterer.prototype.refresh = function refresh() {
  this.clusters.forEach((cluster) => {
    if (cluster.size) {
      cluster.refresh();
    } else {
      console.log('Delete cluster', cluster.size);
      this.clusters.delete(cluster);
    }
    // console.log(this.isWithin(cluster.bounds));
  });
  console.log('Total clusters', this.clusters.size);
};

/**
 * Removes a elements from the clusterer
 * @param  {object}  elements - The markers to be remove.
 * @return  {boolean}  If `true` marker has been removed.
 */
AreaClusterer.prototype.remove = function remove(elements, noDraw) {
  const isRemoved = elements
    .translate((element) => {
      // Remove element from the clusterer
      const removed = this.elements.delete(element);
      console.log('remove', element.id, this.elements.keys, removed);

      // Remove element from the cluster
      if (removed) element.cluster.delete(element);
    })
    .some(elementIsRemoved => elementIsRemoved);

  if (isRemoved && !noDraw) {
    this.resetClusters();
    this.clusterElements();
  } else {
    // this.shrinkCluster();
  }

  return isRemoved;
};

/**
 * Remove existing clusters and recreate them.
 */
AreaClusterer.prototype.repaint = function repaint() {
  const oldClusters = this.clusters.clone();

  this.resetClusters();
  this.clusterElements();

  // Remove the old clusters.
  // Do it in a timeout so the other clusters have been drawn first.
  window.setTimeout(() => {
    oldClusters.forEach((cluster) => { cluster.remove(); });
  }, 0);
};

/**
 * Clears all existing clusters and recreates them.
 */
AreaClusterer.prototype.resetClusters = function resetClusters() {
  this.clusters.forEach((cluster) => { cluster.remove(); });

  this.elementsAddedToClusters = new KeySet();
  this.clusters = new KeySet();
  this.clustersMaxSize = 1;
};

export default AreaClusterer;
