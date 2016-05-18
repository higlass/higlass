import $ from 'jquery';
import _ from 'lodash';
import d3 from 'd3';

// Specification of transfer function.
export class FreeformTransferFunction {
    
    // Construct from 2D control points.
    constructor(controlPoints) {
        this._controlPoints = controlPoints;
        this._controlXs = this._controlPoints.map(p => p[0]);
        this._controlYs = this._controlPoints.map(p => p[1]);
    }
    
    // 2D Control points.
    get controlPoints() {
        return this._controlPoints;
    }
    
    set controlPoints(points) {
        this._controlPoints = points;
    }
    
    // Return new transfer function with control point inserted.
    insertControlPoint(point) {
        var prunedControlPoints = this.controlPoints.filter(p => p[0] !== point[0]);    // Filtered out possible existing point at same x-coordinate. 
        var extendedControlPoints = _.concat(prunedControlPoints, [point]);             // Extended.
        extendedControlPoints.sort((l, r) => l[0] - r[0]);                              // Maintain x-axis consistency. 
        
        // Construct the same object type, including the extra control point.
        return new this.constructor(extendedControlPoints);
    }
    
    // Remove given control point.
    removeControlPoint(index) {
        var prunedControlPoints = _.clone(this.controlPoints);
        _.pullAt(prunedControlPoints, index);
        
        // Construct the same object type, minus the given control point.
        return new this.constructor(prunedControlPoints);
    }
    
    // Map given density to a value in [0,1].
    map(density) {
    }
    
    // Convert to a binned mapping, for performance.
    /*binnedMap(bins) {
        // Construct value bins. Assume function domain lies between first and last control point.
        var binsM1 = bins - 1;
        var lowerBound = _.first(this.controlPoints)[0];
        var upperBound = _.last(this.controlPoints)[0];
        
        var delta = upperBound - lowerBound;
        var values = _.range(bins).map(i => lowerBound + (i * delta) / binsM1);
        var mappedBins = values.map(v => this.map(v));
        
        return (density) => mappedBins[Math.floor(bins * (density - lowerBound) / delta)];
    }*/
    
    // Convert to a binned mapping, for performance, but using an intermediary log scale to improve large range resolution.
    binnedMap(bins) {
        // Construct value bins. Assume function domain lies between first and last control point.
        var binsM1 = bins - 1;
        var lowerBound = Math.log(_.first(this.controlPoints)[0] + 1);  // Space bins in log domain.
        var upperBound = Math.log(_.last(this.controlPoints)[0] + 1);
        
        var delta = upperBound - lowerBound;
        var values = _.range(bins).map(i => lowerBound + (i * delta) / binsM1);
        var mappedBins = values.map(v => this.map(Math.exp(v) - 1));    // Convert mapped values back to regular domain.
        
        return (density) => mappedBins[Math.floor(bins * (Math.log(density + 1) - lowerBound) / delta)];    // Look up bin in log domain.
    }
}

// Transfer function that is a piecewise linear, defined by control points (ordered by domain value).
export class PiecewiseLinearTransferFunction extends FreeformTransferFunction {
    
    // Map given density to a value in [0,1], stick to linear interpolation for now.
    map(density) {
        var result = Number.NaN;
        
        // Find index of density.
        for(let i = 0; i < this._controlXs.length - 1; i++) {
            let lowerX = this._controlXs[i];
            let upperX = this._controlXs[i+1];
            
            if(lowerX <= density && density <= upperX) {
                let deltaX = upperX - lowerX;
                let lowerY = this._controlYs[i];
                let upperY = this._controlYs[i+1];
                let z = (density - lowerX) / deltaX;
                result = (1 - z) * lowerY + z * upperY;
            }
        }
        
        return result;
    }
}

// Specification of object that transforms counts to image data (color mapped).
/*export class TileColorMapper {
    // Take a transfer function that maps a domain to a range of [0, 1].
    constructor(transferFunction) {
        this._transferFunction = transferFunction;
    }
    
    // Map counts (flat array of length N) to imageData with four channels
    // red, green, blue, alpha, as a flat array of length 4 * N. The alpha
    // is set to 1 by default and should not be altered.
    transform(counts, imageArray, dataSetInfo) {
    }
}

export class HeatedObjectColorMapper extends TileColorMapper {
    transform(counts, imageArray, dataSetInfo) {
        // Normalize by max transfer value.
        for (let i = 0; i < counts.length; i++) {
            // Assume transfer function range is [0, 1] for now.
            let transferred = this._transferFunction(counts[i]);

            // Set pixel channels. Apply a heat object color map.
            let aI = 4 * i;
            imageArray[aI]   = heatedObjectMap[transferred][0];   // Red.
            imageArray[aI+1] = heatedObjectMap[transferred][1];   // Green.
            imageArray[aI+2] = heatedObjectMap[transferred][2];   // Blue.
            // Alpha channel has been filled already.
        }
    }
}*/

export class TransferFunctionEditor {
    constructor(parentElement, width, height) {
        this._parentElement = parentElement;
        
        this._axisWidth = 20;
        this._width = width - this._axisWidth;
        this._height = height - this._axisWidth;
        
        this._dotRadius = 4;    // Radius of transfer dots.
        this._dotExpanse = 8;   // Hovered dot radius.
        this._innerWidth = this._width - 2 * this._dotExpanse;
        this._innerHeight = this._height - 2 * this._dotExpanse;
        
        // Change event listeners.
        this.changeListeners = [];
        
        // SVG Canvas.
        this.svg = d3.select(parentElement)
                     .append("svg")
                     .attr("width", width)
                     .attr("height", height)
                     .append("g")
                     .attr("transform", "translate(" + this._dotExpanse + "," + this._dotExpanse + ")");
        
        // Background rectangle to coordinate mouse actions.
        this.background = this.svg.append("rect")
                                  .attr("class", "transferPlot")
                                  .attr("width", this._innerWidth)
                                  .attr("height", this._innerHeight);
        
        // Sampled transfer function polyline, including future transfer function.
        this.line = this.svg
                        .append("path")
                        .attr("class", "transferLine");
        this.futureLine = this.svg
                              .append("path")
                              .attr("class", "futureTransferLine");
                              
        // X and Y axes.
        this.xAxis = this.svg.append("g")
                             .attr("class", "transferAxis");
        
        // Control point dots.
        this.controlDots = this.svg.append("g");
                     
        // X and Y axis scales. Y axis domain is a constant [0,1].
        this.y = d3.scale.linear()
                   .domain([0, 1])
                   .range([this._innerHeight, 0]);
        this.domain = [0, 1];
        
        // Interaction.
        var mousePlotCoordinates = (element) => {
            var eCs = d3.mouse(element.node());
            return [this.x.invert(eCs[0]), this.y.invert(eCs[1])];
        }
        
        // On mouse background movement, adjust future transfer function.
        this.background.on("mousemove", (d) => {
            var newPoint = mousePlotCoordinates(this.background);
            
            // Constrain new point to left- or right-most if it is at the rim.
            if(newPoint[0] < _.first(this.transferFunction.controlPoints)[0]) newPoint[0] = this.domain[0];
            if(newPoint[0] > _.last(this.transferFunction.controlPoints)[0]) newPoint[0] = this.domain[1];
            
            if(this.dragControlDot) {
                this.transferFunction = this.oldTransferFunction.insertControlPoint(newPoint);
            } else {
                this.futureTransferFunction = this.transferFunction.insertControlPoint(newPoint);
            }
        });
        
        this.svg.on("mousedown", () => {
            d3.event.preventDefault();
        });
        
        // Remove future transfer on mouse exit from plot.
        this.background.on("mouseout", () => this.futureTransferFunction = null);
        
        // On mouse background click, adopt future transfer function.
        this.background.on("click", () => {
            this.transferFunction = this.futureTransferFunction;
            this.futureTransferFunction = null;
            this.signalChange();
        });
        
        // Swap transfer function on dragged control dot release.
        this.background.on("mouseup", () => {
            if(this.dragControlDot) {
                this.dragControlDot = false;
                //this.transferFunction = this.futureTransferFunction;
                this.futureTransferFunction = null;
            }
        });
    }
    
    // Domain of transfer function. The range is fixed to [0,1].
    get domain() {
        return this._domain;
    }
    
    set domain(interval) {
        // Limit interval to just above 0 to prevent log scale issues.
        this._domain = _.clone(interval);
        if(this._domain[0] <= 0) this._domain[0] = 0.01;
        
        // Plot scale matches domain. Clamp to prevent log scale issue.
        this.x = d3.scale.log().clamp(true)           //.linear()
                   .domain(this._domain)
                   .range([0, this._innerWidth]);
        
        // Initialize transfer function with identity.
        this.transferFunction = new PiecewiseLinearTransferFunction([
            [interval[0], 0],
            [interval[1], 1]
        ]);
        
        // Possible future transfer function, for added point at mouse.
        this.futureTransferFunction = null;
    }
    
    // Transfer function that is active.
    get transferFunction() {
        return this._transferFunction;
    }
    
    set transferFunction(tF) {
        this._transferFunction = tF;
        this.updateScene();
        this.signalChange();
    }
    
    // Possible future transfer function.
    get futureTransferFunction() {
        return this._futureTransferFunction;
    }
    
    set futureTransferFunction(fTF) {
        this._futureTransferFunction = fTF;
        this.updateScene();
    }
    
    // Update scene elements.
    updateScene() {
        // X and Y axes.
        var xA = d3.svg.axis()
                       .scale(this.x)
                       .ticks(5, "s");
        var yShift = this._innerHeight + this._dotExpanse;
        this.xAxis.attr("transform", "translate(0," + yShift + ")")
                  .call(xA);
        
        // Control dots.
        var controlDots = this.controlDots.selectAll("circle")
                              .data(this._transferFunction.controlPoints, d => d);
                              
        controlDots.enter()
                   .append("circle")
                   .attr("class", "transferDot")
                   .attr("r", this._dotRadius);
        
        controlDots.attr("cx", d => this.x(d[0]))
                   .attr("cy", d => this.y(d[1]));
                   
        controlDots.exit()
                   .remove();
        
        // Adjust control point coordinates on drag.
        controlDots.on("mousedown", (d, i) => {
            this.oldTransferFunction = this.transferFunction.removeControlPoint(i);
            //this.transferFunction = this.transferFunction.removeControlPoint(i);
            this.dragControlDot = true;
        });
        
        // Remove future transfer function on dot hover.
        controlDots.on("mousemove", (d, i) => {
            this.futureTransferFunction = null;
        });
        
        controlDots.on("mouseup", () => {
            if(this.dragControlDot) {
                this.dragControlDot = false;
                this.futureTransferFunction = null;
            }
        });
                   
        // Connecting line.
        var linePath = d3.svg.line()
                         .x((d) => this.x(d[0]))
                         .y((d) => this.y(d[1]))
                         .interpolate("linear");
        this.line.attr("d", linePath(this.transferFunction.controlPoints));
        this.futureLine.attr("d", this.futureTransferFunction ? linePath(this.futureTransferFunction.controlPoints) : []);
    }
    
    get dataSetInfo() {
        return this._dataSetInfo;
    }
    
    set dataSetInfo(dataSetInfo) {
        this._dataSetInfo = dataSetInfo;
        
        // If data set info is not null, then initiate transfer function to identity.
        if(dataSetInfo) {
            this._transfer = (count) => count / dataSetInfo.maxDensity;
        } else {
            this._transfer = null;
        }
    }
    
    // Add change listener.
    onChange(listener) {
        this.changeListeners.push(listener);
    }
    
    // Remove change listener (by reference).
    removeOnChange(listener) {
        _.pull(this.changeListeners, listener);
    }
    
    // Propagate transfer function change.
    signalChange() {
        this.changeListeners.forEach(l => l(this.transferFunction));
    }
}

// Heated object color map lookup table.
// Perceptually linearized: http://www.cs.uml.edu/~haim/ColorCenter/HOCM.htm
var heatedObjectMap = [
    [  0,   0,   0],
    [ 35,   0,   0],
    [ 52,   0,   0],
    [ 60,   0,   0],
    [ 63,   1,   0],
    [ 64,   2,   0],
    [ 68,   5,   0],
    [ 69,   6,   0],
    [ 72,   8,   0],
    [ 74,  10,   0],
    [ 77,  12,   0],
    [ 78,  14,   0],
    [ 81,  16,   0],
    [ 83,  17,   0],
    [ 85,  19,   0],
    [ 86,  20,   0],
    [ 89,  22,   0],
    [ 91,  24,   0],
    [ 92,  25,   0],
    [ 94,  26,   0],
    [ 95,  28,   0],
    [ 98,  30,   0],
    [100,  31,   0],
    [102,  33,   0],
    [103,  34,   0],
    [105,  35,   0],
    [106,  36,   0],
    [108,  38,   0],
    [109,  39,   0],
    [111,  40,   0],
    [112,  42,   0],
    [114,  43,   0],
    [115,  44,   0],
    [117,  45,   0],
    [119,  47,   0],
    [119,  47,   0],
    [120,  48,   0],
    [122,  49,   0],
    [123,  51,   0],
    [125,  52,   0],
    [125,  52,   0],
    [126,  53,   0],
    [128,  54,   0],
    [129,  56,   0],
    [129,  56,   0],
    [131,  57,   0],
    [132,  58,   0],
    [134,  59,   0],
    [134,  59,   0],
    [136,  61,   0],
    [137,  62,   0],
    [137,  62,   0],
    [139,  63,   0],
    [139,  63,   0],
    [140,  65,   0],
    [142,  66,   0],
    [142,  66,   0],
    [143,  67,   0],
    [143,  67,   0],
    [145,  68,   0],
    [145,  68,   0],
    [146,  70,   0],
    [146,  70,   0],
    [148,  71,   0],
    [148,  71,   0],
    [149,  72,   0],
    [149,  72,   0],
    [151,  73,   0],
    [151,  73,   0],
    [153,  75,   0],
    [153,  75,   0],
    [154,  76,   0],
    [154,  76,   0],
    [154,  76,   0],
    [156,  77,   0],
    [156,  77,   0],
    [157,  79,   0],
    [157,  79,   0],
    [159,  80,   0],
    [159,  80,   0],
    [159,  80,   0],
    [160,  81,   0],
    [160,  81,   0],
    [162,  82,   0],
    [162,  82,   0],
    [163,  84,   0],
    [163,  84,   0],
    [165,  85,   0],
    [165,  85,   0],
    [166,  86,   0],
    [166,  86,   0],
    [166,  86,   0],
    [168,  87,   0],
    [168,  87,   0],
    [170,  89,   0],
    [170,  89,   0],
    [171,  90,   0],
    [171,  90,   0],
    [173,  91,   0],
    [173,  91,   0],
    [174,  93,   0],
    [174,  93,   0],
    [176,  94,   0],
    [176,  94,   0],
    [177,  95,   0],
    [177,  95,   0],
    [179,  96,   0],
    [179,  96,   0],
    [180,  98,   0],
    [182,  99,   0],
    [182,  99,   0],
    [183, 100,   0],
    [183, 100,   0],
    [185, 102,   0],
    [185, 102,   0],
    [187, 103,   0],
    [187, 103,   0],
    [188, 104,   0],
    [188, 104,   0],
    [190, 105,   0],
    [191, 107,   0],
    [191, 107,   0],
    [193, 108,   0],
    [193, 108,   0],
    [194, 109,   0],
    [196, 110,   0],
    [196, 110,   0],
    [197, 112,   0],
    [197, 112,   0],
    [199, 113,   0],
    [200, 114,   0],
    [200, 114,   0],
    [202, 116,   0],
    [202, 116,   0],
    [204, 117,   0],
    [205, 118,   0],
    [205, 118,   0],
    [207, 119,   0],
    [208, 121,   0],
    [208, 121,   0],
    [210, 122,   0],
    [211, 123,   0],
    [211, 123,   0],
    [213, 124,   0],
    [214, 126,   0],
    [214, 126,   0],
    [216, 127,   0],
    [217, 128,   0],
    [217, 128,   0],
    [219, 130,   0],
    [221, 131,   0],
    [221, 131,   0],
    [222, 132,   0],
    [224, 133,   0],
    [224, 133,   0],
    [225, 135,   0],
    [227, 136,   0],
    [227, 136,   0],
    [228, 137,   0],
    [230, 138,   0],
    [230, 138,   0],
    [231, 140,   0],
    [233, 141,   0],
    [233, 141,   0],
    [234, 142,   0],
    [236, 144,   0],
    [236, 144,   0],
    [238, 145,   0],
    [239, 146,   0],
    [241, 147,   0],
    [241, 147,   0],
    [242, 149,   0],
    [244, 150,   0],
    [244, 150,   0],
    [245, 151,   0],
    [247, 153,   0],
    [247, 153,   0],
    [248, 154,   0],
    [250, 155,   0],
    [251, 156,   0],
    [251, 156,   0],
    [253, 158,   0],
    [255, 159,   0],
    [255, 159,   0],
    [255, 160,   0],
    [255, 161,   0],
    [255, 163,   0],
    [255, 163,   0],
    [255, 164,   0],
    [255, 165,   0],
    [255, 167,   0],
    [255, 167,   0],
    [255, 168,   0],
    [255, 169,   0],
    [255, 169,   0],
    [255, 170,   0],
    [255, 172,   0],
    [255, 173,   0],
    [255, 173,   0],
    [255, 174,   0],
    [255, 175,   0],
    [255, 177,   0],
    [255, 178,   0],
    [255, 179,   0],
    [255, 181,   0],
    [255, 181,   0],
    [255, 182,   0],
    [255, 183,   0],
    [255, 184,   0],
    [255, 187,   7],
    [255, 188,  10],
    [255, 189,  14],
    [255, 191,  18],
    [255, 192,  21],
    [255, 193,  25],
    [255, 195,  29],
    [255, 197,  36],
    [255, 198,  40],
    [255, 200,  43],
    [255, 202,  51],
    [255, 204,  54],
    [255, 206,  61],
    [255, 207,  65],
    [255, 210,  72],
    [255, 211,  76],
    [255, 214,  83],
    [255, 216,  91],
    [255, 219,  98],
    [255, 221, 105],
    [255, 223, 109],
    [255, 225, 116],
    [255, 228, 123],
    [255, 232, 134],
    [255, 234, 142],
    [255, 237, 149],
    [255, 239, 156],
    [255, 240, 160],
    [255, 243, 167],
    [255, 246, 174],
    [255, 248, 182],
    [255, 249, 185],
    [255, 252, 193],
    [255, 253, 196],
    [255, 255, 204],
    [255, 255, 207],
    [255, 255, 211],
    [255, 255, 218],
    [255, 255, 222],
    [255, 255, 225],
    [255, 255, 229],
    [255, 255, 233],
    [255, 255, 236],
    [255, 255, 240],
    [255, 255, 244],
    [255, 255, 247],
    [255, 255, 255]
];