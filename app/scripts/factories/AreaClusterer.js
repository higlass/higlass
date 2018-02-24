import AreaCluster, { nearestNeighbor } from './AreaCluster';
import KeySet from './KeySet';

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

  this.disabled = options.disabled;

  this.propCheck = {};
  this.isPropCheck = false;

  if (options.propCheck) {
    options.propCheck.forEach((prop) => {
      this.propCheck[prop[0]] = {
        min: Infinity,
        max: -Infinity,
        acc: prop[1]
      };
      this.isPropCheck = true;
    });
  }
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
    if (element.cluster) {
      if (this.clusters.has(element.cluster)) {
        element.cluster.show(element);
      } else {
        // Something got messed up. Let's clear the cluster assignment.
        element.cluster = undefined;
      }
    }
  });

  if (!noDraw) this.clusterElements();
};

/**
 * Add an element to the clostest cluster, or creates a new cluster.
 * @param  {object}  element - The element to be added.
 */
AreaClusterer.prototype.addToOrCreateCluster = function addToOrCreateCluster(element) {
  let distance = this.defaultMinDist;
  let closestCluster = null;
  const elementCenter = element.getViewPositionCenter();

  if (!this.disabled) {
    this.clusters
      .filter(cluster => !cluster.isHidden)
      .forEach((cluster) => {
        const clusterCenter = cluster.center;
        if (clusterCenter) {
          const d = lDist(clusterCenter, elementCenter);
          if (d < distance) {
            distance = d;
            closestCluster = cluster;
          }
        }
      });
  }

  let cluster = closestCluster;

  if (closestCluster && closestCluster.isWithin(element.viewPos, true)) {
    this.expandCluster(closestCluster, element);
  } else {
    cluster = this.createCluster(element);
  }

  return cluster;
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
  this.minX = minX;
  this.maxX = maxX;
  this.minY = minY;
  this.maxY = maxY;
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
      this.addToOrCreateCluster(element);
    }
  });
};

/**
 * Check properties on the given cluster
 */
AreaClusterer.prototype.propChecking = function propChecking(cluster) {
  if (!this.isPropCheck) return;

  Object.keys(this.propCheck).forEach((key) => {
    this.propCheck[key].min = Math.min(
      this.propCheck[key].min,
      this.propCheck[key].acc(cluster)
    );

    this.propCheck[key].max = Math.max(
      this.propCheck[key].max,
      this.propCheck[key].acc(cluster)
    );
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
  this.propChecking(cluster);

  return cluster;
};

/**
 * Add an element to an existing cluster
 */
AreaClusterer.prototype.expandCluster = function expandCluster(cluster, element) {
  cluster.add(element);
  element.cluster = cluster;
  this.clustersMaxSize = Math.max(this.clustersMaxSize, cluster.size);
  this.elementsAddedToClusters.add(element);
  this.propChecking(cluster);
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

/**
 * Evaluate clusters
 * @param   {number}  isZoomed  Determins the zoom stage `-1` refers to zoom
 *   out, `1` refers to zoom in and `0` is no zoom (only panning).
 */
AreaClusterer.prototype.eval = function evalMethod(isZoomed = 0) {
  if (isZoomed === 1) this.evalZoomedIn();
  if (isZoomed === -1) this.evalZoomedOut();
};


AreaClusterer.prototype.mergeClusters = function mergeClusters(
  clusterA, clusterB
) {
  console.log('mergeClusters', clusterA.size, clusterB.size);
  clusterB.members.values.forEach((annotation) => {
    clusterB.delete(annotation);
    clusterA.add(annotation);
  });
  this.propChecking(clusterA);
  clusterA.reload = true;
  this.clusters.delete(clusterB);
  console.log('mergeClusters', clusterA.size, clusterB.size);
  clusterB = null;
};

AreaClusterer.prototype.evalZoomedOut = function evalZoomedOut() {
  console.log('evalZoomedOut');
  // 1. Check which clusters are within bounds. Effectivly cluster the clusters.
  this.clusters.forEach((clusterCurr) => {
    this.clusters.forEach((cluster) => {
      if (
        cluster !== clusterCurr &&
        clusterCurr.isWithin(cluster.bounds, true, this.gridSize * 0.25)
      ) {
        this.mergeClusters(clusterCurr, cluster);
      }
    });
  });
};

AreaClusterer.prototype.evalZoomedIn = function evalZoomedIn() {
  // Since we only check zoomed in. The only thing that can happen are cluster
  // splits.

  const maxD = this.gridSize * 1.5;

  this.clusters
    .filter(cluster => cluster.size > 1)
    .forEach((cluster) => {
      // Get the farthest nearest neighbor as this is the only potential breaking
      // point.
      const fnn = cluster.fnns.peek();

      if (!fnn) return;

      // Re-evaluate distance between farthest nearest neighbors
      const d = lDist(fnn.a.center, fnn.b.center);

      // To avoid to frequent splitting and merging we only split when the
      // farthest neighbor is twice as far as allowed for being within the bounds
      if (d > maxD) {
        this.splitCluster(cluster, fnn);
      }
    });
};

AreaClusterer.prototype.splitCluster = function splitCluster(cluster, fnn) {
  if (!this.clusters.has(cluster) || cluster.size === 1) return;

  // Split at the furthest neighbor
  const _fnn = fnn || cluster.fnns.peek();
  const maxD = this.gridSize * 1.5;
  const newCluster = new AreaCluster(this.isAverageCenter, this.gridSize);
  cluster.delete(_fnn.b);
  newCluster.add(_fnn.b);

  let srcNode = _fnn.b;
  let [nn, d] = nearestNeighbor(cluster.members.values, srcNode);

  while (d < maxD && cluster.size > 1) {
    cluster.delete(nn);
    newCluster.add(nn);

    srcNode = nn;
    [nn, d] = nearestNeighbor(cluster.members.values, srcNode);
  }

  this.clusters.add(newCluster);
  this.propChecking(newCluster);
  this.propChecking(cluster);
  cluster.reload = true;
};

AreaClusterer.prototype.refresh = function refresh() {
  this.clusters.forEach((cluster) => {
    cluster.refresh();

    // Remove entire cluster of it's out of bounds
    if (
      !this.isWithin(cluster.bounds) ||
      !cluster.size
    ) {
      this.removeCluster(cluster);
    }
  });
};

/**
 * Removes a elements from the clusterer
 * @param  {object}  elements - The markers to be remove.
 * @return  {boolean}  If `true` marker has been removed.
 */
AreaClusterer.prototype.remove = function remove(elements, noDraw = false) {
  const isRemoved = elements
    .translate((element) => {
      if (element.cluster) {
        this.shrinkCluster(element.cluster, element);
      }

      this.elementsAddedToClusters.delete(element);

      // Remove element from the clusterer
      return this.elements.delete(element);
    })
    .some(elementIsRemoved => elementIsRemoved);

  if (isRemoved && !noDraw) {
    this.resetClusters();
    this.clusterElements();
  }

  return isRemoved;
};

/**
 * Remove a cluster
 */
AreaClusterer.prototype.removeCluster = function removeCluster(cluster) {
  cluster.members.forEach((member) => {
    member.cluster = undefined;
    this.elementsAddedToClusters.delete(member);
    this.elements.delete(member);
  });

  this.clusters.delete(cluster);

  this.clusters.forEach(_cluster => this.propChecking(_cluster));
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

/**
 * Add an element to an existing cluster
 */
AreaClusterer.prototype.shrinkCluster = function shrinkCluster(cluster, element) {
  cluster.delete(element);

  if (cluster.size) {
    this.clustersMaxSize = this.clusters.reduce(
      (maxSize, _cluster) => Math.max(maxSize, _cluster.size), 0
    );
    this.elementsAddedToClusters.delete(element);
    this.propChecking(cluster);
    cluster.reload = true;
  } else {
    this.removeCluster(cluster);
  }
};

export default AreaClusterer;
