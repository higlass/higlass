import { bisector } from 'd3-array';
import { format } from 'd3-format';
import absToChr from './utils/abs-to-chr';

class SearchField {
  constructor(chromInfo) {
    this.chromInfo = chromInfo;
    this.chromInfoBisector = bisector((d) => d.pos).left;
  }

  scalesToPositionText(xScale, yScale, twoD = false) {
    if (this.chromInfo === null) {
      return '';
    } // chromosome info hasn't been loaded yet

    if (!xScale || !yScale) {
      return '';
    }

    const x1 = absToChr(xScale.domain()[0], this.chromInfo);
    const x2 = absToChr(xScale.domain()[1], this.chromInfo);

    const y1 = absToChr(yScale.domain()[0], this.chromInfo);
    const y2 = absToChr(yScale.domain()[1], this.chromInfo);

    let positionString = null;
    const stringFormat = format(',d');

    if (x1[0] !== x2[0]) {
      // different chromosomes

      positionString = `${x1[0]}:${stringFormat(Math.floor(x1[1]))}-${
        x2[0]
      }:${stringFormat(Math.ceil(x2[1]))}`;
    } else {
      // same chromosome

      positionString = `${x1[0]}:${stringFormat(
        Math.floor(x1[1]),
      )}-${stringFormat(Math.ceil(x2[1]))}`;
    }

    if (twoD) {
      if (y1[0] !== y2[0]) {
        // different chromosomes
        positionString += ` & ${y1[0]}:${stringFormat(Math.floor(y1[1]))}-${
          y2[0]
        }:${stringFormat(Math.ceil(y2[1]))}`;
      } else {
        // same chromosome
        positionString += ` & ${y1[0]}:${stringFormat(
          Math.floor(y1[1]),
        )}-${stringFormat(Math.ceil(y2[1]))}`;
      }
    }

    if (x1[2] <= 0 || x2[2] > 0 || (twoD && (y1[2] <= 0 || y2[2] > 0))) {
      // did any of the coordinates exceed the genome boundaries
      positionString += ` [offset ${x1[2]},${x2[2]}`;
      if (twoD) {
        positionString += `:${y1[2]},${y2[2]}`;
      }

      positionString += ']';
    }

    return positionString;
  }

  convertNumberNotation(numStr) {
    // Convert K or M notations
    // e.g. "1.5M" to "1500000"
    // or "0.05M" to "50000"
    // or even "00.05M" or "00.050M" to "50000"
    let newNumStr = numStr;

    if (
      !newNumStr.includes('M', newNumStr.length - 1) &&
      !newNumStr.includes('K', newNumStr.length - 1)
    ) {
      // Nothing to convert
      return newNumStr;
    }

    let numZerosToAdd = 0;
    let decPointPosFromEnd = 0;

    // Handle 'M' or 'N' notations
    if (newNumStr.includes('M', newNumStr.length - 1)) {
      numZerosToAdd = 6;
      newNumStr = newNumStr.replace('M', '');
    } else {
      numZerosToAdd = 3;
      newNumStr = newNumStr.replace('K', '');
    }

    if (Number.isNaN(+newNumStr)) {
      // Without 'K' or 'M' notation, the string should be converted to a valid number.
      return numStr;
    }

    // Drop the needless characters for the simplicity (e.g., "00.5" to "0.5" or "1,000" to "1000").
    newNumStr = (+newNumStr).toString();

    // Handle a decimal point
    if (newNumStr.includes('.')) {
      decPointPosFromEnd = newNumStr.length - 1 - newNumStr.indexOf('.');
      newNumStr = (+newNumStr.replace('.', '')).toString();
    }

    const totalZerosToAdd = numZerosToAdd - decPointPosFromEnd;
    if (totalZerosToAdd < 0) {
      // The value is smaller than 1 (e.g. "0.00005K")
      return numStr;
    }

    // Finally, add zeros at the end.
    newNumStr += '0'.repeat(totalZerosToAdd);

    return newNumStr;
  }

  parsePosition(positionText, prevChr = null) {
    // Parse chr:position strings...
    // i.e. chr1:1000
    // or   chr2:20000
    const positionParts = positionText.split(':');
    let chr = null;
    let pos = 0;

    if (positionParts.length > 1) {
      chr = positionParts[0];
      pos = +this.convertNumberNotation(positionParts[1].replace(/,/g, '')); // chromosome specified
    } else if (positionParts[0] in this.chromInfo.chrPositions) {
      // is this an entire chromosome
      chr = positionParts[0];
      pos = 0;

      if (prevChr !== null) {
        // this chromosome is part of a range so we actually
        // want to search to the end of it
        pos = +this.chromInfo.chromLengths[chr];
      }
    } else {
      // no it's just a position without a chromosome
      pos = +this.convertNumberNotation(positionParts[0].replace(/,/g, '')); // no chromosome specified
      chr = null;

      if (prevChr) chr = prevChr;
    }

    // If chromosome doesn't exit
    let retPos = null;

    if (chr === null) {
      // queries like chr1:1000-2000
      chr = prevChr;
      // no chromosome provided, so this is just a number
      retPos = pos;
    } else if (chr in this.chromInfo.chrPositions) {
      // chromosome provided, everything is fine
      retPos = this.chromInfo.chrPositions[chr].pos + pos;
    }

    // retPos is the genome position of this pair
    return [chr, pos, retPos];
  }

  matchRangesToLarger(range1, range2) {
    // if one range is wider than the other, then adjust the other
    // so that it is just as wide
    if (range1[1] - range1[0] < range2[1] - range2[0]) {
      const toExpand = range2[1] - range2[0] - (range1[1] - range1[0]);
      return [[range1[0] - toExpand / 2, range1[1] + toExpand / 2], range2];
    }
    const toExpand = range1[1] - range1[0] - (range2[1] - range2[0]);
    return [range1, [range2[0] - toExpand / 2, range2[1] + toExpand / 2]];
  }

  getSearchRange(term) {
    // Get the genomic regions associated with this term
    // Example terms:
    // tp53
    // tp53 (nm_000546)
    // tp53 to adh1b
    // tp53 (nm_000546) to adh1b

    if (term.length === 0) {
      return null;
    }

    // shitty ass regex to deal with negative positions
    // (which aren't even valid genomic coordinates)
    let parts = term.split('-'); // split on a
    parts = parts.filter((d) => d.length > 0);

    let range = null;

    if (parts[0].indexOf('-') === 0) {
      parts[0] = parts[0].slice(3, parts[0].length);
    }

    if (parts.length > 1) {
      // calculate the range in one direction
      /* eslint-disable-next-line no-unused-vars */
      let [chr1, chrPos1, genomePos1] = this.parsePosition(parts[0]);
      /* eslint-disable-next-line no-unused-vars */
      let [chr2, chrPos2, genomePos2] = this.parsePosition(parts[1], chr1);

      const tempRange1 = [genomePos1, genomePos2];

      [chr1, chrPos1, genomePos1] = this.parsePosition(parts[1]);
      /* eslint-disable-next-line no-unused-vars */
      [chr2, chrPos2, genomePos2] = this.parsePosition(parts[0], chr1);

      if (chr1 === null && chr2 !== null) {
        // somembody entered a string like chr17:1000-2000
        // and when we try to search the rever, the first chromosome
        // is null
        // we have to pass in the previous chromosome as a prevChrom
        /* eslint-disable-next-line no-unused-vars */
        [chr1, chrPos1, genomePos1] = this.parsePosition(parts[1], chr2);
      }

      const tempRange2 = [genomePos1, genomePos2];

      // return the wider of the two ranges
      // e.g. searching for chr1-chr2 vs chr2-chr1
      if (tempRange2[1] - tempRange2[0] > tempRange1[1] - tempRange1[0])
        return tempRange2;
      return tempRange1;
    }
    // only a locus specified and no range
    // is the locus an entire chromosome?

    if (parts[0] in this.chromInfo.chrPositions) {
      const chromPosition = +this.chromInfo.chrPositions[parts[0]].pos;

      // if somebody has entered an entire chromosome, we return
      // it's length as the range
      range = [
        chromPosition,
        chromPosition + +this.chromInfo.chromLengths[parts[0]],
      ];
    } else {
      // e.g. ("chr1:540340")
      // eslint-disable-next-line no-unused-vars
      const [chr1, chrPos1, pos1] = this.parsePosition(parts[0]);

      range = [pos1 - 8000000, pos1 + 8000000];
    }

    if (range[0] > range[1]) {
      return [range[1], range[0]];
    }

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

    const parts = offsetText.split(':');

    if (parts.length === 0) {
      return [
        [0, 0],
        [0, 0],
      ];
    }

    if (parts.length === 1) {
      const sparts = parts[0].split(',');
      return [
        [+sparts[0], +sparts[1]],
        [0, 0],
      ];
    }
    const sparts0 = parts[0].split(',');
    const sparts1 = parts[1].split(',');
    return [
      [+sparts0[0], +sparts0[1]],
      [+sparts1[0], +sparts1[1]],
    ];
  }

  searchPosition(text) {
    let range1 = null;

    let range2 = null;
    text = text.trim(); // remove whitespace from the ends of the string

    // extract offset
    const offsetRe = /\[offset (.+?)\]/.exec(text);

    // the offset is the distance before the first chromosome
    // or the distance after the last chromosome of the given
    let offset = [
      [0, 0],
      [0, 0],
    ];
    if (offsetRe) {
      text = text.replace(offsetRe[0], '');

      //
      offset = this.parseOffset(offsetRe[1]);
    }

    const parts = text.split(' & ');

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

    if (range1 !== null && range2 !== null) {
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

export default SearchField;
