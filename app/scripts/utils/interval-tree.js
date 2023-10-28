// @ts-nocheck
function IntervalTreeNode(start, end, left, right) {
  /**
   * Node interval.
   * @member {Array}
   */
  this.interval = [start, end];
  /**
   * Max endpoint in subtree which starts from this node.
   * @member {Number}
   */
  this.max = -Infinity;
  /**
   * Parent node.
   * @member {IntervalTreeNode}
   */
  this.parentNode = null;
  /**
   * Left child node.
   * @member {IntervalTreeNode}
   */
  this.left = left;
  /**
   * Right child node.
   * @member {IntervalTreeNode}
   */
  this.right = right;
}

/**
 * Interval tree.
 *
 * @public
 * @constructor
 */
export default function IntervalTree() {
  /**
   * Root node of the tree.
   * @member {IntervalTreeNode}
   */
  this.root = null;
}

function addNode(node, side, interval) {
  let child = new IntervalTreeNode(interval[0], interval[1]);
  child.max = interval[1];
  child.parentNode = node;
  node[side] = child;
  if (node.max < interval[1]) {
    while (child) {
      if (child.max < interval[1]) {
        child.max = interval[1];
      }
      child = child.parentNode;
    }
  }
}

function addHelper(node, interval) {
  if (node.interval[0] > interval[0]) {
    if (node.left) {
      addHelper(node.left, interval);
    } else {
      addNode(node, 'left', interval);
    }
  } else if (node.right) {
    addHelper(node.right, interval);
  } else {
    addNode(node, 'right', interval);
  }
}

/**
 * Add new interval to the tree.
 *
 * @public
 * @param {Array} intreval Array with start and end points of the interval.
 */
IntervalTree.prototype.add = function add(interval) {
  if (!this.root) {
    this.root = new IntervalTreeNode(interval[0], interval[1]);
    this.root.max = interval[1];
    return;
  }
  addHelper(this.root, interval);
};

function contains(point, node) {
  if (!node) {
    return false;
  }
  if (node.interval[0] <= point && node.interval[1] >= point) {
    return true;
  }
  let result = false;
  let temp;
  ['left', 'right'].forEach((key) => {
    temp = node[key];
    if (temp) {
      if (temp.max > point) {
        result = result || contains(point, temp);
      }
    }
  });
  return result;
}

/**
 * Checks or point belongs to at least one intarval from the tree.<br><br>
 * Complexity: O(log N).
 *
 * @public
 * @method
 * @param {Number} point Point which should be checked.
 * @return {Boolean} True if point belongs to one of the intervals.
 */
IntervalTree.prototype.contains = function _contains(point) {
  return contains(point, this.root);
};

function intersects(a, b) {
  return (
    // The first case checks for completely overlapping
    // intervals. Necessary because we usually consider
    // the ends to be open ended and that misses completely
    // overlapping intervals
    (a[0] === b[0] && a[1] === b[1]) ||
    (a[0] < b[0] && a[1] > b[0]) ||
    (a[0] < b[1] && a[1] > b[1]) ||
    (b[0] < a[0] && b[1] > a[0]) ||
    (b[0] < a[1] && b[1] > a[1])
  );
}

function intersectsHelper(interval, node) {
  if (!node) {
    return false;
  }
  if (intersects(node.interval, interval)) {
    return true;
  }
  let result = false;
  let temp;
  ['left', 'right'].forEach((side) => {
    temp = node[side];
    if (temp && temp.max >= interval[0]) {
      result = result || intersectsHelper(interval, temp);
    }
  });
  return result;
}

/**
 * Checks or interval belongs to at least one intarval from the tree.<br><br>
 * Complexity: O(log N).
 *
 * @public
 * @method
 * @param {Array} interval Interval which should be checked.
 * @return {Boolean} True if interval intersects with one of the intervals.
 */
IntervalTree.prototype.intersects = function _intersects(interval) {
  return intersectsHelper(interval, this.root);
};

function heightHelper(node) {
  if (!node) {
    return 0;
  }
  return 1 + Math.max(heightHelper(node.left), heightHelper(node.right));
}

/**
 * Returns height of the tree.
 *
 * @public
 * @method
 * @return {Number} Height of the tree.
 */
IntervalTree.prototype.height = function height() {
  return heightHelper(this.root);
};

/**
 * Returns node with the max endpoint in subtree.
 *
 * @public
 * @method
 * @param {IntervalTreeNode} node Root node of subtree.
 * @return {IntervalTreeNode} IntervalTreeNode with the largest endpoint.
 */
IntervalTree.prototype.findMax = function findMax(node) {
  const stack = [node];
  let current;
  let max = -Infinity;
  let maxNode;
  while (stack.length) {
    current = stack.pop();
    if (current.left) {
      stack.push(current.left);
    }
    if (current.right) {
      stack.push(current.right);
    }
    if (current.interval[1] > max) {
      max = current.interval[1];
      maxNode = current;
    }
  }
  return maxNode;
};

// adjust the max value
IntervalTree.prototype._removeHelper = function _removeHelper(interval, node) {
  if (!node) {
    return;
  }
  if (node.interval[0] === interval[0] && node.interval[1] === interval[1]) {
    // When left and right children exists
    if (node.left && node.right) {
      let replacement = node.left;
      while (replacement.left) {
        replacement = replacement.left;
      }
      const temp = replacement.interval;
      replacement.interval = node.interval;
      node.interval = temp;
      this._removeHelper(replacement.interval, node);
    } else {
      // When only left or right child exists
      let side = 'left';
      if (node.right) {
        side = 'right';
      }
      const parentNode = node.parentNode;
      if (parentNode) {
        if (parentNode.left === node) {
          parentNode.left = node[side];
        } else {
          parentNode.right = node[side];
        }
        if (node[side]) {
          node[side].parentNode = parentNode;
        }
      } else {
        this.root = node[side];
        // last node removed
        if (this.root) {
          this.root.parentNode = null;
        }
      }
    }
    // Adjust the max value
    const p = node.parentNode;
    if (p) {
      let maxNode = this.findMax(p);
      const max = maxNode.interval[1];
      while (maxNode) {
        if (maxNode.max === node.interval[1]) {
          maxNode.max = max;
          maxNode = maxNode.parentNode;
        } else {
          maxNode = false;
        }
      }
    }
  } else {
    // could be optimized
    this._removeHelper(interval, node.left);
    this._removeHelper(interval, node.right);
  }
};

/**
 * Remove interval from the tree.
 *
 * @public
 * @method
 * @param {Array} intreval Array with start and end of the interval.
 */
IntervalTree.prototype.remove = function remove(interval) {
  return this._removeHelper(interval, this.root);
};
