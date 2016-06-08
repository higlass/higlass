export class SearchField {

    constructor(chromInfo, xOrigScale, yOrigScale, zoomDispatch) {
        this.chromInfo = chromInfo;
        this.xOrigScale = xOrigScale;
        this.yOrigScale = yOrigScale;
        this.zoomDispatch = zoomDispatch;
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

            console.log('range1:', range1, 'range2:', range2);

            xZoomParams = this.zoomTo(this.xOrigScale, range1);
            yZoomParams = this.zoomTo(this.yOrigScale, range2);

            this.zoomDispatch.zoom([xZoomParams.translate,0], 
                                    xZoomParams.scale);
        } else if (range1 != null) {
            // adjust the x-axis
            console.log('range1:', range1);

            var xZoomParams = this.zoomTo(this.xOrigScale, 
                                          range1);
            var yZoomParams = this.zoomTo(this.yOrigScale,
                                          range1);
            // here we have to find out which range is wider and adjust
            // the other one to match
            console.log('xZoomParams:', xZoomParams);
            console.log('yZoomParams:', yZoomParams);

            // assuming that xOrigScale and yOrigScale are the same, then
            // xZoomParams.scale should work here
            // otherwise we could want to choose the larger zoom value of
            this.zoomDispatch.zoom([xZoomParams.translate,yZoomParams.translate], 
                                    xZoomParams.scale);
        } else if (range2 != null) {
            //adjust the y-axis
            console.log('range2:', range2);
        }


        // move the zoom to the appropriate ranges
    }

    zoomTo(scale, range) {
        let value = range[0];
        console.log('value:', value)
        let zoomScale = (scale.domain()[1] - scale.domain()[0]) / (range[1] - range[0])

        console.log('scale.domain():', scale.domain())

        return {'scale': zoomScale, 'translate': scale.range()[0] - scale(value * zoomScale)}
    }
}
