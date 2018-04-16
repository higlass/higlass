import AreaCluster, { nearestNeighbor } from './AreaCluster';
import KeySet from './KeySet';

import { insert, lDist, max, min } from '../utils';


function AreaClusterer(options = {}) {
  this.elements = new KeySet();
  this.elementsAddedToClusters = new KeySet();
  this.clusters = new KeySet();

  this.gridSize = options.gridSize || 30;
  this.maxClusterSize = options.maxClusterSize || Infinity;
  this.maxClusterDiameter = options.maxClusterDiameter || 60;
  this.maxZoom = options.maxZoom || null;
  this.isAverageCenter = !!options.averageCenter || true;
  this.defaultMinDist = options.defaultMinDist || 40000;
  this.clusterAmong = options.clusterAmong || false;

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
        acc: prop[1],
        values: [],
      };
      this.isPropCheck = true;
    });
  }
}

/* ------------------------------- Properties ------------------------------- */

function getSize() {
  return this.clusters.size;
}

Object.defineProperty(AreaClusterer.prototype, 'size', { get: getSize });

/* --------------------------------- Methods -------------------------------- */

/**
 * Add an array of elements to the clusterer.
 *
 * @param  {KeySet}  elements - The elements to be added.
 * @param  {Boolean}  noDraw - If `true` markers are *not* redrawn.
 */
function add(elements, reDraw = false) {
  elements.forEach((element) => {
    this.elements.add(element);
  });

  if (reDraw) this.clusterElements();
}

function cleanUp(elementsToKeep, reDraw = false) {
  this.remove(
    this.elements.filter(element => !elementsToKeep.has(element)), reDraw
  );

  this.clusters.forEach((cluster) => {
    // Remove non-existing annotations from cluster. Not sure where they come
    // from but they sometime appear.
    this.remove(
      cluster.members.filter(element => !elementsToKeep.has(element)), reDraw
    );
  });
}

function isClusterable(a, b) {
  return (
    !this.clusterAmong ||
    a.type === b.type
  );
}

/**
 * Add an element to the clostest cluster, or creates a new cluster.
 * @param  {object}  element - The element to be added.
 */
function addToOrCreateCluster(element) {
  let distance = this.defaultMinDist;
  let closestCluster = null;
  const elementCenter = element.center;

  if (!this.disabled) {
    this.clusters
      .filter(cluster => (
        !cluster.isDisconnected &&
        this.isClusterable(cluster, element)
      ))
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
  const combClustDia = closestCluster
    ? this.combinedDiameter(closestCluster, element)
    : false;

  if (
    closestCluster &&
    closestCluster.size < this.maxClusterSize &&
    closestCluster.isWithin(element.viewPos, true) &&
    (
      combClustDia <= this.maxClusterDiameter ||
      combClustDia <= closestCluster.diameter
    )
  ) {
    this.expandCluster(closestCluster, element);
  } else {
    cluster = this.createCluster(element);
  }

  return cluster;
}

/**
 * Gets the bound for the clusterer.
 * @return  {array}  bounds  Quadrupel of form `[minX, maxX, minY, maxY]`.
 */
function getBounds() {
  return [this.minX, this.maxX, this.minY, this.maxY];
}

/**
 * Sets the bounds for the clusterer.
 * @param   {number}  minX  Left most X position.
 * @param   {number}  maxX  Right most X position.
 * @param   {number}  minY  Top most Y position.
 * @param   {number}  maxY  Bottom most Y position.
 */
function setBounds(minX, maxX, minY, maxY) {
  this.minX = minX;
  this.maxX = maxX;
  this.minY = minY;
  this.maxY = maxY;
}

/**
 * Remove all clusters and elements from the clusterer.
 */
function clear() {
  this.resetClusters(true);

  // Set the markers a new empty set
  this.elements = new KeySet();
  this.elementsAddedToClusters = new KeySet();
  this.clusters = new KeySet();
  this.clustersMaxSize = 1;
}

/**
 * Assign each element to a cluster or create a new cluster
 * @param  {array}  bins - If length greater than zero only cluster within
 *   bins.
 */
function clusterElements() {
  this.elements.forEach((element) => {
    if (
      !this.elementsAddedToClusters.has(element) &&
      this.isWithin(element.viewPos, true)
    ) {
      this.addToOrCreateCluster(element);
    }
  });
}

/**
 * Check properties on the given cluster
 */
function propChecking(cluster) {
  if (!this.isPropCheck) return;

  Object.keys(this.propCheck).forEach((key) => {
    insert(this.propCheck[key].values, this.propCheck[key].acc(cluster));

    this.propCheck[key].min = Math.min(
      this.propCheck[key].min,
      this.propCheck[key].acc(cluster)
    );

    this.propCheck[key].max = Math.max(
      this.propCheck[key].max,
      this.propCheck[key].acc(cluster)
    );
  });
}

/**
 * Create a new the clusters.
 */
function createCluster(element) {
  const cluster = new AreaCluster(this.isAverageCenter, this.gridSize);
  cluster.add(element);

  this.elementsAddedToClusters.add(element);
  this.clusters.add(cluster);
  this.propChecking(cluster);

  return cluster;
}

/**
 * Add an element to an existing cluster
 */
function expandCluster(cluster, element) {
  cluster.add(element);
  element.cluster = cluster;
  this.clustersMaxSize = Math.max(this.clustersMaxSize, cluster.size);
  this.elementsAddedToClusters.add(element);
  this.propChecking(cluster);
  cluster.changed();
}

/**
 * Returns the size of the grid.
 * @return  {number}  The grid size.
 */
function getGridSize() {
  return this.gridSize;
}

/**
 * Sets the size of the grid.
 * @param  {number}  size - The grid size.
 */
function setGridSize(size) {
  this.gridSize = size;
}

/**
 * Check if an element is within the bounds of this clusterer
 */
function isWithin(
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
}

/**
 * Evaluate clusters
 * @param   {number}  zoomed  Determins the zoom stage `-1` refers to zoom
 *   out, `1` refers to zoom in and `0` is no zoom (only panning).
 */
function evalMethod(zoomed = 0) {
  if (zoomed === 1) this.evalZoomedIn();
  if (zoomed === -1) this.evalZoomedOut();
}


/**
 * Compute the combined diameter of a cluster and cluster or cluster and
 *   annotation.
 * @param   {AreaCluster|Annotation}  a  Element having minX, maxX, minY, maxY
 *   display coordinates in pixel.
 * @param   {AreaCluster|Annotation}  b  Element having minX, maxX, minY, maxY
 *   display coordinates in pixel.
 * @return  {number}  Combined Manhattan diameter.
 */
function combinedDiameter(a, b) {
  const minX = min(a.minX, b.minX);
  const maxX = max(a.maxX, b.maxX);
  const minY = min(a.minY, b.minY);
  const maxY = max(a.maxY, b.maxY);
  return max(maxX - minX, maxY - minY);
}


function mergeClusters(
  clusterA, clusterB
) {
  clusterB.members.values.forEach((annotation) => {
    clusterB.delete(annotation);
    clusterA.add(annotation);
  });
  this.propChecking(clusterA);

  this.removeCluster(clusterB, true);
}

function evalZoomedOut() {
  // 1. Check which clusters are within bounds. Effectivly cluster the clusters.
  this.clusters.forEach((clusterA) => {
    this.clusters.forEach((clusterB) => {
      if (
        !clusterA.isRemoved &&
        !clusterB.isRemoved &&
        !clusterA.isDisconnected &&
        !clusterB.isDisconnected &&
        clusterA.size + clusterB.size <= this.maxClusterSize &&
        clusterA !== clusterB &&
        this.isClusterable(clusterA, clusterB) &&
        clusterA.isWithin(clusterB.bounds, true, this.gridSize * 0.5) &&
        (
          this.combinedDiameter(clusterA, clusterB) <= max(clusterA.diameter, clusterB.diameter) ||
          this.combinedDiameter(clusterA, clusterB) < this.maxClusterDiameter
        )
      ) {
        this.mergeClusters(clusterA, clusterB);
      }
    });
  });
}

function evalZoomedIn() {
  // Since we only check zoomed in. The only thing that can happen are cluster
  // splits.

  const maxD = this.gridSize * 1.5;

  this.clusters
    .filter(cluster => cluster.size > 1)
    .forEach((cluster) => {
      // Get the farthest nearest neighbor as this is the only potential
      // breaking point.
      const fnn = cluster.fnns.peek();

      if (!fnn) return;

      // Compute distance between farthest nearest neighbors in display
      // coordinates (aka. pixels on the screen)
      const d = lDist(fnn.a.center, fnn.b.center);

      // To avoid to frequent splitting and merging we only split when the
      // farthest neighbor is twice as far as allowed for being within the
      // bounds
      if (d > maxD && !cluster.isDisconnected) {
        this.splitCluster(cluster);
      }
    });
}

function splitCluster(cluster) {
  if (!this.clusters.has(cluster) || cluster.size === 1) return;

  const removeIf = nn => (cFnn, i) => {
    if (cFnn.a === nn || cFnn.b === nn) {
      cluster.fnns.poll(i);
    }
  };

  // Split at the furthest neighbor
  const fnn = cluster.fnns.poll();
  const maxD = this.gridSize * 1.5;
  const newCluster = new AreaCluster(this.isAverageCenter, this.gridSize);
  cluster.delete(fnn.a);
  newCluster.add(fnn.a);

  let srcNode = fnn.a;
  let [nn] = nearestNeighbor(cluster.members.values, srcNode);
  // Re-evaluate distance between nearest neighbor
  let d = lDist(nn.center, srcNode.center);

  while (d < maxD && cluster.size > 1) {
    cluster.delete(nn);
    newCluster.add(nn);
    const removeIfNn = removeIf(nn);
    cluster.fnns.array.forEach(removeIfNn);

    srcNode = nn;
    [nn] = nearestNeighbor(cluster.members.values, srcNode);
    d = lDist(nn.center, srcNode.center);
  }

  this.clusters.add(newCluster);
  this.propChecking(newCluster);
  this.propChecking(cluster);
  cluster.fnns.trim();
}

function refresh() {
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
}

/**
 * Removes a elements from the clusterer
 * @param  {KeySet}  elements - The markers to be remove.
 * @return  {Boolean}  If `true` marker has been removed.
 */
function remove(elements, reDraw = false) {
  const isRemoved = elements
    .translate((element) => {
      const clust = element.cluster;
      if (clust && !clust.isRemoved) {
        this.shrinkCluster(clust, element);
      }

      this.elementsAddedToClusters.delete(element);

      // Remove element from the clusterer
      return this.elements.delete(element);
    })
    .some(elementIsRemoved => elementIsRemoved);

  if (isRemoved && reDraw) {
    this.resetClusters();
    this.clusterElements();
  }

  return isRemoved;
}

/**
 * Remove a cluster
 */
function removeCluster(cluster, keepElements = false) {
  if (!keepElements) {
    cluster.members.forEach((member) => {
      member.cluster = undefined;
      this.elementsAddedToClusters.delete(member);
      this.elements.delete(member);
    });
  }

  this.clusters.delete(cluster);
  cluster.remove();

  this.clusters.forEach(_cluster => this.propChecking(_cluster));
}

/**
 * Remove existing clusters and recreate them.
 */
function repaint() {
  const oldClusters = this.clusters.clone();

  this.resetClusters();
  this.clusterElements();

  // Remove the old clusters.
  // Do it in a timeout so the other clusters have been drawn first.
  window.setTimeout(() => {
    oldClusters.forEach((cluster) => { cluster.remove(); });
  }, 0);
}

/**
 * Clears all existing clusters and recreates them.
 */
function resetClusters() {
  this.clusters.forEach((cluster) => { cluster.remove(); });

  this.elementsAddedToClusters = new KeySet();
  this.clusters = new KeySet();
  this.clustersMaxSize = 1;
}

/**
 * Remove an element from an existing cluster
 */
function shrinkCluster(cluster, element) {
  cluster.delete(element);

  if (cluster.size) {
    this.clustersMaxSize = this.clusters.reduce(
      (maxSize, _cluster) => Math.max(maxSize, _cluster.size), 0
    );
    this.elementsAddedToClusters.delete(element);
    this.propChecking(cluster);
  } else {
    this.removeCluster(cluster);
  }
}

/**
 * Update the clustering, i.e., add and remove elements and re-cluster if
 *   necessary.
 * @param  {KeySet}  elements - The elements to be added.
 * @param  {number}  zoomed - Determins the zoom stage `-1` refers to zoom
 *   out, `1` refers to zoom in and `0` is no zoom (only panning).
 */
function update(elements, zoomed) {
  this.cleanUp(elements);
  this.add(elements);
  this.eval(zoomed);
  this.refresh();
  this.clusterElements();
}

Object.assign(AreaClusterer.prototype, {
  add,
  addToOrCreateCluster,
  getBounds,
  setBounds,
  clear,
  cleanUp,
  clusterElements,
  combinedDiameter,
  propChecking,
  createCluster,
  expandCluster,
  getGridSize,
  setGridSize,
  isClusterable,
  isWithin,
  eval: evalMethod,
  mergeClusters,
  evalZoomedOut,
  evalZoomedIn,
  splitCluster,
  refresh,
  remove,
  removeCluster,
  repaint,
  resetClusters,
  shrinkCluster,
  update,
});

export default AreaClusterer;
