export class SearchField {

    constructor(chromInfo) {
        this.chromInfo = chromInfo;
    }

    parsePosition(positionText) {
        // Parse chr:position strings...
        // i.e. chr1:1000
        // or   chr2:20000
        var positionParts = positionText.split(':');
        var chr = positionParts[0];

        var pos = 0;
        if (positionParts.length > 1)
            pos = +positionParts[1];

        let retPos = null;

        if (isNaN(pos))
            retPos = null;

        if (chr in this.chromInfo.chrPositions)
            retPos = this.chromInfo.chrPositions[chr].pos + pos;
        else
            retPos = null;

        return retPos;
    }

    matchRangesToLarger(range1, range2) {
        // if one range is wider than the other, then adjust the other
        // so that it is just as wide
        let smaller = null, larger = null;

        if ((range1[1] - range1[0]) < (range2[1] - range2[0])) {
            let toExpand = (range2[1] - range2[0]) - (range1[1] - range1[0]);
            return [[range1[0] - toExpand / 2, range1[1] + toExpand /2], range2];
        } else {
            let toExpand = (range1[1] - range1[0]) - (range2[1] - range2[0]);
            return [range1, [range2[0] - toExpand / 2, range2[1] + toExpand / 2]]
        }
    }

    getSearchRange(term) {
        // Get the genomic regions associated with this term
        // Example terms:
        // tp53
        // tp53 (nm_000546)
        // tp53 to adh1b
        // tp53 (nm_000546) to adh1b

        if (term.length == 0)
            return null;

        var parts = term.split(' to ');
        var pos1 = null, pos2 = null;
        var range = null;


        if (parts[0].indexOf('to ') == 0) {
            parts[0] = parts[0].slice(3, parts[0].length)
        }

        if (parts.length > 1) {
            pos1 = this.parsePosition(parts[0]);
            pos2 = this.parsePosition(parts[1]);

            range = [pos1, pos2];
        } else {
            pos1 = this.parsePosition(parts[0]);

            range = [pos1 - 8000000, pos1 + 8000000];
        }

        return range;
    }

    searchPosition(text) {
        var range1 = null, range2 = null;

        var parts = text.split(' and ');

        if (parts.length > 1) {
            // we need to move both axes
            // although it's possible that the first axis will be empty
            // i.e. someone enters " and p53"
            // in that case, we only move the second axis and keep the first where it is
            range1 = this.getSearchRange(parts[0]);
            range2 = this.getSearchRange(parts[1]);
        } else {
            // we just need to position the first axis
            range1 = this.getSearchRange(parts[0]);
        }

        if (range1 != null && range2 != null) {
            [range1, range2] = this.matchRangesToLarger(range1, range2);
        }

        return [range1, range2];
    }

}
