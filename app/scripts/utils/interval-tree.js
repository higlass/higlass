/** @typedef {[start: number, end: number]} Interval */

class IntervalTreeNode {
  /**
   * @param {number} start
   * @param {number} end
   * @param {IntervalTreeNode} [left]
   * @param {IntervalTreeNode} [right]
   */
  constructor(start, end, left, right) {
    /**
     * Node interval.
     * @type {Interval}
     */
    this.interval = [start, end];
    /**
     * Max endpoint in subtree which starts from this node.
     * @type {number}
     */
    this.max = Number.NEGATIVE_INFINITY;
    /**
     * Parent node.
     * @type {IntervalTreeNode | null}
     */
    this.parentNode = null;
    /**
     * Left child node.
     * @type {IntervalTreeNode | null}
     */
    this.left = left ?? null;
    /**
     * Right child node.
     * @type {IntervalTreeNode | null}
     */
    this.right = right ?? null;
  }
}

/**
 * Interval tree.
 *
 * @public
 * @constructor
 */
export class IntervalTree {
  constructor() {
    /**
     * Root node of the tree.
     * @type {IntervalTreeNode | null}
     */
    this.root = null;
  }
  /**
   * Add new interval to the tree.
   *
   * @public
   * @param {Interval} interval - Array with start and end points of the interval.
   */
  add(interval) {
    if (!this.root) {
      this.root = new IntervalTreeNode(interval[0], interval[1]);
      this.root.max = interval[1];
      return;
    }
    addHelper(this.root, interval);
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
  contains(point) {
    return contains(point, this.root);
  }
  /**
   * Checks or interval belongs to at least one intarval from the tree.<br><br>
   * Complexity: O(log N).
   *
   * @public
   * @method
   * @param {Interval} interval Interval which should be checked.
   * @return {boolean} True if interval intersects with one of the intervals.
   */
  intersects(interval) {
    return intersectsHelper(interval, this.root);
  }
  /**
   * Returns height of the tree.
   *
   * @public
   * @method
   * @return {Number} Height of the tree.
   */
  height() {
    return heightHelper(this.root);
  }
  /**
   * Returns node with the max endpoint in subtree.
   *
   * @public
   * @method
   * @param {IntervalTreeNode} node Root node of subtree.
   * @return {IntervalTreeNode | null} IntervalTreeNode with the largest endpoint.
   */
  findMax(node) {
    const stack = [node];
    let current;
    let max = Number.NEGATIVE_INFINITY;
    let maxNode;
    while (stack.length) {
      current = stack.pop();
      if (current?.left) {
        stack.push(current.left);
      }
      if (current?.right) {
        stack.push(current.right);
      }
      // @ts-expect-error - ok assertion
      if (current?.interval[1] > max) {
        // @ts-expect-error - only ok if above assertion succeeds
        max = current.interval[1];
        maxNode = current;
      }
    }
    return maxNode ?? null;
  }

  /**
   * Adjust the max value.
   *
   * @param {Interval} interval
   * @param {IntervalTreeNode | null} node
   */
  _removeHelper(interval, node) {
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
        /** @type {"left" | "right"} */
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
            // @ts-expect-error - ok to set to a node
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
        const max = maxNode?.interval[1] ?? Number.NEGATIVE_INFINITY;
        while (maxNode) {
          if (maxNode.max === node.interval[1]) {
            maxNode.max = max;
            maxNode = maxNode.parentNode;
          } else {
            maxNode = null;
          }
        }
      }
    } else {
      // could be optimized
      this._removeHelper(interval, node.left);
      this._removeHelper(interval, node.right);
    }
  }
  /**
   * Remove interval from the tree.
   *
   * @public
   * @method
   * @param {Interval} interval - Array with start and end of the interval.
   */
  remove(interval) {
    return this._removeHelper(interval, this.root);
  }
}

/**
 * @param {IntervalTreeNode} node
 * @param {"left"| "right"} side
 * @param {Interval} interval
 * @returns {void}
 */
function addNode(node, side, interval) {
  /** @type {IntervalTreeNode | null} */
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

/**
 * @param {IntervalTreeNode} node
 * @param {Interval} interval
 * @returns {void}
 */
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
 * @param {number} point
 * @param {IntervalTreeNode | null} node
 * @returns {boolean}
 */
function contains(point, node) {
  if (!node) {
    return false;
  }
  if (node.interval[0] <= point && node.interval[1] >= point) {
    return true;
  }
  let result = false;
  let temp;
  /** @type {const} */ (['left', 'right']).forEach((key) => {
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
 * @param {Interval} a
 * @param {Interval} b
 * @returns {boolean}
 */
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

/**
 * @param {Interval} interval
 * @param {IntervalTreeNode | null} node
 * @returns {boolean}
 */
function intersectsHelper(interval, node) {
  if (!node) {
    return false;
  }
  if (intersects(node.interval, interval)) {
    return true;
  }
  let result = false;
  let temp;
  /** @type {const} */ (['left', 'right']).forEach((side) => {
    temp = node[side];
    if (temp && temp.max >= interval[0]) {
      result = result || intersectsHelper(interval, temp);
    }
  });
  return result;
}

/**
 * @param {IntervalTreeNode | null} node
 * @returns {number}
 */
function heightHelper(node) {
  if (!node) {
    return 0;
  }
  return 1 + Math.max(heightHelper(node.left), heightHelper(node.right));
}
