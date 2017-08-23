import {bisector} from 'd3-array';
import {format} from 'd3-format';
import {absoluteToChr} from './utils';

export class SearchField {

    constructor(chromInfo) {
        this.chromInfo = chromInfo;
        this.chromInfoBisector = bisector((d) => { return d.pos }).left;
    }

    scalesToPositionText(xScale, yScale, twoD=false) {
        if (this.chromInfo == null)
            return "";                 // chromosome info hasn't been loaded yet

        if (!xScale || !yScale)
            return "";

        let x1 = absoluteToChr(xScale.domain()[0], this.chromInfo);
        let x2 = absoluteToChr(xScale.domain()[1], this.chromInfo);

        let y1 = absoluteToChr(yScale.domain()[0], this.chromInfo);
        let y2 = absoluteToChr(yScale.domain()[1], this.chromInfo);

        let positionString = null;
        let stringFormat = format(",d")

        if (x1[0] != x2[0]) {
            // different chromosomes

            positionString = x1[0] + ':' + stringFormat(Math.floor(x1[1])) + '-' + x2[0] + ':' + stringFormat(Math.ceil(x2[1]));
        } else {
            // same chromosome

            positionString = x1[0] + ':' + stringFormat(Math.floor(x1[1])) + '-' + stringFormat(Math.ceil(x2[1]));
        }

        if (twoD) {
            if (y1[0] != y2[0]) {
                // different chromosomes
                positionString += " & " +  y1[0] + ':' + stringFormat(Math.floor(y1[1])) + '-' + y2[0] + ':' + stringFormat(Math.ceil(y2[1]));
            } else {
                // same chromosome
                positionString += " & " +  y1[0] + ':' + stringFormat(Math.floor(y1[1])) + '-' + stringFormat(Math.ceil(y2[1]));
            }
        }


        if (x1[2] <= 0 || x2[2] > 0 || (twoD && (y1[2] <= 0 || y2[2] > 0))) {
            // did any of the coordinates exceed the genome boundaries
            positionString += " [offset " + x1[2] + "," + x2[2];
            if (twoD) {
               positionString += ":" + y1[2] + "," + y2[2]
            }

            positionString += "]";
        }

        return positionString;
    }

    parsePosition(positionText, prevChr = null) {
        // Parse chr:position strings...
        // i.e. chr1:1000
        // or   chr2:20000
        var positionParts = positionText.split(':');
        let chr = null;
        let pos = 0;

        if (positionParts.length > 1) {
            chr = positionParts[0];
            pos = +positionParts[1].replace(/,/g, '');    //chromosome specified
        } else {
            pos = +positionParts[0].replace(/,/g, ''); // no chromosome specified
            chr = null;
        }

        let retPos = null;

        if (isNaN(pos))
            retPos = null;

        if (chr == null)
            chr = prevChr

        if (chr == null) {
            retPos = pos;
        } else if (chr in this.chromInfo.chrPositions) {
            retPos = this.chromInfo.chrPositions[chr].pos + pos;
        } else {
            // console.log("Search error: No chromInfo specified or chromosome (" + chr + ") not in chromInfo");
            retPos = null;
        }

        // retPos is the genome position of this pair
        return [chr, pos, retPos];
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

        // shitty ass regex to deal with negative positions (which aren't even valid genomic coordinates)
        var parts = term.split(/([0-9,a-z:A-Z-]+?[0-9]+)-([0-9,a-z:A-Z-]+)/);   //split on a
        parts = parts.filter((d) => { return d.length > 0 });

        var pos1 = null, pos2 = null;
        var range = null;


        if (parts[0].indexOf('-') == 0) {
            parts[0] = parts[0].slice(3, parts[0].length)
        }

        if (parts.length > 1) {
            let [chr1, chrPos1, genomePos1] = this.parsePosition(parts[0]);
            let [chr2, chrPos2, genomePos2]  = this.parsePosition(parts[1], chr1);

            range = [genomePos1, genomePos2];
        } else {
            // only a locus specified and no range
            pos1 = this.parsePosition(parts[0]);

            range = [pos1 - 8000000, pos1 + 8000000];
        }

        if (range[0] > range[1])
            return [range[1], range[0]];

        return range;
    }

    parseOffset(offsetText) {
        /**
         * Convert offset text to a 2D array of offsets
         *
         * @param offsetText(string): 14,17:20,22
         *
         * @return offsetArray: [[14,17],[20,22]]
         */

        let parts = offsetText.split(':');
        // console.log('parseOffset parts:', parts);

        if (parts.length == 0)
            return [[0,0],[0,0]];

        if (parts.length == 1) {
            let sparts = parts[0].split(',');
            return [[+sparts[0], +sparts[1]],[0,0]]
        } else {
            let sparts0 = parts[0].split(',');
            let sparts1 = parts[1].split(',');
            return [[+sparts0[0], +sparts0[1]],
                    [+sparts1[0], +sparts1[1]]]

        }

        return [[0,0],[0,0]]
    }

    searchPosition(text) {
        var range1 = null, range2 = null;
        text = text.trim();   // remove whitespace from the ends of the string

        //extract offset
        let offsetRe = /\[offset\ (.+?)\]/.exec(text);

        // the offset is the distance before the first chromosome
        // or the distance after the last chromosome of the given
        let offset = [[0,0],[0,0]];
        if (offsetRe) {
            text = text.replace(offsetRe[0], '');

            //
            offset = this.parseOffset(offsetRe[1]);
        }

        var parts = text.split(' & ');

        if (parts.length > 1) {
            // we need to move both axes
            // although it's possible that the first axis will be empty
            // i.e. someone enters " and p53"
            // in that case, we only move the second axis and keep the first where it is
            range1 = this.getSearchRange(parts[0].split(' ')[0]);
            range2 = this.getSearchRange(parts[1].split(' ')[0]);
        } else {
            // we just need to position the first axis
            range1 = this.getSearchRange(parts[0]);
        }

        if (range1 != null && range2 != null) {
            [range1, range2] = this.matchRangesToLarger(range1, range2);
        }

        if (range1) {
            range1[0] += offset[0][0];
            range1[1] += offset[0][1];
        }

        if (range2) {
            range2[0] += offset[1][0];
            range2[1] += offset[1][1];

        }

        return [range1, range2];
    }

}
