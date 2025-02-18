import { IntervalTree } from './interval-tree';

/** @typedef {{ from:number, to: number }} Segment */

/**
 * Partition a list of segments into an array of rows containing the segments.
 *
 * WARNING: Sorts the `segments` array input _inplace_.
 *
 * @param {Array<Segment>} segments An array of segments (e.g. [{from: 10, to: 20}, {from: 18, to: 30}])
 * @return: {Array<Array<Segment>>} non-overlapping rows of segments
 */
function segmentsToRows(segments) {
  // sort by the length of each segment
  segments.sort((a, b) => b.to - b.from - (a.to - a.from));

  /** @type {Array<Array<Segment>>} */
  const rows = [[]];
  const rowIts = [new IntervalTree()];

  // fill out each row with segments
  for (let i = 0; i < segments.length; i++) {
    let placed = false;

    for (let j = 0; j < rows.length; j++) {
      const it = rowIts[j]; // an interval tree

      /** @type {[number, number]} */
      const toCheck = [+segments[i].from, +segments[i].to];
      const occluded = it.intersects(toCheck);

      if (!occluded) {
        // no intersections on this row, place this segment here
        it.add(toCheck);
        rows[j].push(segments[i]);
        placed = true;
        break;
      }
    }

    if (!placed) {
      const newTree = new IntervalTree();

      newTree.add([segments[i].from, segments[i].to]);
      rows.push([segments[i]]);
      rowIts.push(newTree);
    }
  }

  return rows;
}

export default segmentsToRows;
