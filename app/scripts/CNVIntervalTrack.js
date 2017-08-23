import {scaleBand} from 'd3-scale';
import {range} from 'd3-array';
import {HorizontalTiled1DPixiTrack} from './HorizontalTiled1DPixiTrack';
import IntervalTree from './interval-tree';

export class CNVIntervalTrack extends HorizontalTiled1DPixiTrack {
    constructor(scene, server, uid, handleTilesetInfoReceived, options, animate) {
        super(scene, server, uid, handleTilesetInfoReceived, options, animate);

        //console.log('CNVInterval:', this);
        this.seen = new Set();
        this.pMain = this.pMobile;

        this.rows = [];
    }

    uid(item) {
        return item[item.length-2];
    }

    segmentOverlap(segment1, segment2) {

    }

    segmentsToRows(segments) {
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

        let rows = [[]];
        let rowIts = [new IntervalTree()];

        // fill out each row with segments
        for (let i = 0; i < segments.length; i++) {
            let placed = false;

            for (let j = 0; j < rows.length; j++) {
                let it = rowIts[j]; // an interval tree

                let occluded = it.intersects([segments[i].from, segments[i].to]);

                if (!occluded) {

                    // no intersections on this row, place this segment here
                    it.add([segments[i].from, segments[i].to]);
                    rows[j].push(segments[i]);
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                let newTree = new IntervalTree();

                newTree.add([segments[i].from, segments[i].to]);
                rows.push([segments[i]]);
                rowIts.push(newTree);
            }
        }

        return rows;
    }

    drawAll(allTileData) {
        this.pMain.clear();
        let seen = new Set();

        let segments = allTileData
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


        let rows = this.segmentsToRows(segments);
        this.rows = rows;

        this.draw();

    }

    draw() {
        let rows = this.rows;

        if (!rows)
            return;

        let valueScale = scaleBand().range([0, this.dimensions[1]]).padding(0.1)
        .domain(range(0, this.maxRows()));  // draw one away from the center
        //.domain(range(0, 10));  // draw one away from the center

        let graphics = this.pMain;

        graphics.clear();

        graphics.lineStyle(1, 0x0000FF, 0);
        graphics.beginFill(0xFF700B, 0.8);

        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < rows[i].length; j++) {
                let interval = rows[i][j];

                let x1 = this._refXScale(interval.from);
                let x2 = this._refXScale(interval.to);

                let y1 = valueScale(i)
                let y2 = y1 + valueScale.bandwidth();

                let width = x2 - x1;
                let height = y2 - y1;

                graphics.drawRect(x1, y1, width, height);
            }
        }

    }

    allTilesLoaded() {
        let visibleAndFetchedIds = this.visibleAndFetchedIds();

        let tileDatas = visibleAndFetchedIds.map(x => this.fetchedTiles[x].tileData.discrete);
        let allTileData = [].concat.apply([], tileDatas);

        this.drawAll(allTileData);
    }



    initTile(tile) {

    }

    maxRows() {
        return this.rows.length;
    }

    updateTile(tile) {
        //this.redraw(tile);
    }

    destroyTile(tile) {
        tile.tileData.discrete.map((x) => {
            let uid = x[x.length-2];

            if (this.seen.has(uid))
                this.seen.delete(uid);
        });
    }

    drawTile(tile) {

    }
}
