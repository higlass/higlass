import {scaleBand} from 'd3-scale';
import {range} from 'd3-array';
import {HorizontalTiled1DPixiTrack} from './HorizontalTiled1DPixiTrack.js';
//import IntervalTree from 'interval-tree2';
//import * as jsAlgorithms from 'javascript-algorithms';
import IntervalTree from './interval-tree.js';

export class CNVIntervalTrack extends HorizontalTiled1DPixiTrack {
    constructor(scene, server, uid) {
        super(scene, server, uid);

        //console.log('CNVInterval:', this);
        this.seen = new Set();
    }

    uid(item) {
        return item[item.length-2];
    }

    segmentOverlap(segment1, segment2) {

    }

    segmentsToRows(segments, tileStart, tileEnd) {
        /**
         * Partition a list of segments into an array of
         * rows containing the segments.
         *
         * @param segments: An array of segments (e.g. [{from: 10, to: 20}, {from: 18, to: 30}])
         * @return: An array of arrays of segments, representing 
         *          non-overlapping rows of segments
         */
        // sort by the length of each segment
        segments.sort((a,b) => { return (b.to - b.from) - (a.to - a.from); })
        let it = new IntervalTree((tileStart + tileEnd) / 2);

        let rows = [[]];
        let rowIts = [new IntervalTree()];
        //console.log('tileStart:', tileStart, 'tileEnd:', tileEnd);

        //console.log('tileStart:', tileStart);

        // fill out each row with segments
        for (let i = 0; i < segments.length; i++) {
            let placed = false;

            for (let j = 0; j < rows.length; j++) {
                let it = rowIts[j]; // an interval tree

                let occluded = it.intersects([segments[i].from, segments[i].to]);

                if (!occluded) {
                    /*
                    if (tileStart == 0) {
                        console.log('arow:', j, 'adding', segments[i].from, segments[i].to);
                    }
                    */
                    // no intersections on this row, place this segment here
                    it.add([segments[i].from, segments[i].to]);
                    rows[j].push(segments[i]);
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                let newTree = new IntervalTree();
                /*
                if (tileStart == 0) {
                    console.log('new row:', rows.length, 'adding', segments[i].from, segments[i].to);
                }
                */
                newTree.add([segments[i].from, segments[i].to]);
                rows.push([segments[i]]);
                rowIts.push(newTree);
            }
        }

        /*
        if (tileStart == 0) {
             console.log('rows:', rows);
            console.log('len(rows)', rows.length);
        }
        */

        return rows;
    }

    redraw(tile) {
        tile.graphics.clear();
        let seen = new Set();

        //console.log('td:', tile.tileData.discrete.filter(x => {  return +x[1] < 12000000 && +x[2] > 12000000; }));
        console.log(tile.tileId, tile.tileData.discrete);

        let segments = tile.tileData.discrete
            .map((x) => {
                if (seen.has(this.uid(x)))
                    return null;
                seen.add(this.uid(x));
                //console.log('length:', +x[2] - +x[1], 'id', tile.tileId)
                return  {'from': +x[1],
                         'to': +x[2],
                         'type': x[4],
                         'uid': this.uid(x)}
            })
            .filter(x => x); //filter out null values


        let {tileX, tileWidth} = this.getTilePosAndDimensions(tile.tileData.zoomLevel, tile.tileData.tilePos);
        let rows = this.segmentsToRows(segments, tileX, tileX + tileWidth);
        tile.rows = rows;

        let valueScale = scaleBand().range([0, this.dimensions[1]]).padding(0.1)
        .domain(range(0, this.maxRows()));  // draw one away from the center
        //.domain(range(0, 10));  // draw one away from the center

        let graphics = tile.graphics;

        graphics.lineStyle(1, 0x0000FF, 0);
        graphics.beginFill(0xFF700B, 0.5);

        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < rows[i].length; j++) {
                let interval = rows[i][j];

                let x1 = this._refXScale(interval.from);
                let x2 = this._refXScale(interval.to);

                let y1 = valueScale(i)
                let y2 = y1 + valueScale.bandwidth();

                let width = x2 - x1;
                let height = y2 - y1;

                /*
                if (tileX == 0 || tileX == 1048576) {
                    if (!isNaN(height)) {
                        if (y1 == 5) {
                            console.log('drawing:', i, interval);
                            console.log('x1:', x1, 'y1', y1, 'height:', height);
                        }
                    } else {
                        //console.log('skipping:', i, interval);
                    }
                }
                */


                /*
                if (rows[i][j].from < 12000000 && rows[i][j].to > 12000000)
                    console.log('drawing:', i, j, rows[i][j]);
                */
                graphics.drawRect(x1, y1, width, height);
            }
        }
    }


    initTile(tile) {
        this.redraw(tile);
    }

    maxRows() {
        let visibleAndFetchedIds = this.visibleAndFetchedIds();

        let max = Math.max.apply(null,
            visibleAndFetchedIds.map(x => {
                //console.log('ft:', this.fetchedTiles[x]);
                if ('rows' in this.fetchedTiles[x])
                    return this.fetchedTiles[x].rows.length;
                return 0;
            }));

        return max;
    }

    updateTile(tile) {
        this.redraw(tile);
    }

    destroyTile(tile) {
        tile.tileData.discrete.map((x) => {
            let uid = x[x.length-2];

            if (this.seen.has(uid))
                this.seen.delete(uid);
        });
    }

    drawTile(tile) {
        //let {tileX, tileWidth} = this.getTilePosAndDimensions(tile.tileData.zoomLevel, tile.tileData.tilePos);

        //console.log('tileX:', tileX, 'tile:', tile);
    }
}
