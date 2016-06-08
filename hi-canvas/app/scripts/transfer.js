import '../styles/transfer.css';

import $ from 'jquery';
import _ from 'lodash';
import d3 from 'd3';

// Transfer function that is a piecewise linear, defined by control points (ordered by domain value).
export class PiecewiseLinearTransferFunction {
       
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
    insertControlPoint(point, fixedDomain) {
        var prunedControlPoints = this.controlPoints.filter(p => p[0] !== point[0]);    // Filtered out possible existing point at same x-coordinate. 
        var extendedControlPoints = _.concat(prunedControlPoints, [point]);             // Extended.
        extendedControlPoints.sort((l, r) => l[0] - r[0]);                              // Maintain x-axis consistency.
        
        // Create control points to cover entire domain.
        var newControlPoints = new this.constructor(extendedControlPoints);
        newControlPoints.coverDomain(fixedDomain);
        
        return newControlPoints;
    }
    
    // Remove given control point.
    removeControlPoint(index, fixedDomain) {
        var result = this;
        
        // First and last points cannot be removed.
        if(index > 0 && index < this._controlPoints.length - 1) {
            var prunedControlPoints = _.clone(this.controlPoints);
            _.pullAt(prunedControlPoints, index);
            
            // Create control points to cover entire domain.
            result = new this.constructor(prunedControlPoints);
            result.coverDomain(fixedDomain);
        }
        
        return result;
    }
    
    // Create control points to cover entire domain.
    coverDomain(domain) {
        if(domain) {
            var firstControl = _.first(this._controlPoints);
            var lastControl = _.last(this._controlPoints);
            
            firstControl[0] = Math.min(firstControl[0], domain[0]);
            lastControl[0] = Math.max(lastControl[0], domain[1]);
        }
    }
    
    // Convert to a binned mapping, for performance, but using an intermediary log scale to improve large range resolution.
    binnedMap(bins) {
        // Construct value bins. Assume function domain lies between first and last control point.
        var binsM1 = bins - 1;
        var lowerBound = Math.log(_.first(this.controlPoints)[0] + 1);  // Space bins in log domain.
        var upperBound = Math.log(_.last(this.controlPoints)[0] + 1);
        
        var delta = upperBound - lowerBound;
        
        var values = _.range(bins).map(i => lowerBound + (i * delta) / binsM1);
        var mappedBins = values.map(v => this.map(Math.exp(v) - 1));    // Convert mapped values back to regular domain.
        
        return (density) => {
            // Protect bin bounds.
            var binIndex = Math.floor(bins * (Math.log(density + 1) - lowerBound) / delta); // Look up bin in log domain.
            binIndex = Math.min(Math.max(0, binIndex), binsM1); // Clamp bins (off-domain values are extrapolated with nearest neighbor approach).
            
            return mappedBins[binIndex];
        };
    }
    
    // Map given density to a value in [0,1], stick to linear interpolation for now.
    map(density) {
        var result = Number.NaN;
        
        // Find index of density.
        for(let i = 0; i < this._controlXs.length - 1; i++) {
            let lowerX = this._controlXs[i];
            let upperX = this._controlXs[i+1];
            
            if(lowerX <= density && density <= upperX) {
                let lowerXLog = Math.log(lowerX + 1);
                let upperXLog = Math.log(upperX + 1);
                let deltaX = upperXLog - lowerXLog;
                
                let lowerY = this._controlYs[i];
                let upperY = this._controlYs[i+1];
                let z = (Math.log(density + 1) - lowerXLog) / deltaX;
                result = (1 - z) * lowerY + z * upperY;
            }
        }
        
        // Fix out of bounds error -> clamp when out of range.
        if(!result) {
            if(density < this._controlXs[0]) result = this._controlYs[0];
            if(density > this._controlXs[this._controlXs.length-1]) result = this._controlYs[this._controlXs.length-1];
        }
        
        return result;
    }
}

export class TransferFunctionEditor {
    constructor(parentElement, width, height, mapColors) {
        this._parentElement = parentElement;
        
        this._axisWidth = 20;
        this._width = width - this._axisWidth;
        this._height = height - this._axisWidth;
        this._mapColors = mapColors;
        
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
        var baseTransform = "translate(" + this._axisWidth + ",0)";
        this.background = this.svg.append("rect")
                                  .attr("class", "transferPlot")
                                  .attr("transform", baseTransform)
                                  .attr("width", this._innerWidth)
                                  .attr("height", this._innerHeight);
        
        // Sampled transfer function polyline, including future transfer function.
        this.line = this.svg
                        .append("path")
                        .attr("transform", baseTransform)
                        .attr("class", "transferLine");
        this.futureLine = this.svg
                              .append("path")
                              .attr("transform", baseTransform)
                              .attr("class", "futureTransferLine");
                              
        // X and Y axes. X axis is domain dependent and volatile, updated in updateScene function.
        this.xAxis = this.svg.append("g")
                             .attr("class", "transferAxis");
        this.yAxis = this.svg.append("g").selectAll("rect")
                             .data(_.range(this._innerHeight));
        this.yAxis.enter()
                  .append("rect")
                  .attr("x", 0)
                  .attr("y", d => d)
                  .attr("width", .5 * this._axisWidth)
                  .attr("height", 1)
                  .style("fill", (d, i) => {
                      let val = i / (this._innerHeight - 1);
                      let color = mapColors[Math.floor((1 - val) * (mapColors.length - 1))];
                      return "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
                  });
        
        // Control point dots.
        this.controlDots = this.svg.append("g")
                                   .attr("transform", baseTransform);
                     
        // X and Y axis scales. Y axis domain is a constant [0,1].
        this.y = d3.scale.linear()
                   .domain([0, 1])
                   .range([this._innerHeight, 0]);
        this.domain = [1, 2];   // Initiate with arbitrary domain.
        
        // Interaction.
        var mousePlotCoordinates = (element) => {
            var eCs = d3.mouse(element.node());
            return [this.x.invert(eCs[0]), this.y.invert(eCs[1])];
        }
        
        // On mouse background movement, adjust future transfer function.
        this.background.on("mousemove", (d) => {
            var newPoint = mousePlotCoordinates(this.background);
            
            if(this.dragControlDot) {
                // Constrain new point to left- or right-most if it is at the rim.
                this.transferFunction = this.oldTransferFunction.insertControlPoint(newPoint, this.domain);
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
                this.futureTransferFunction = null;
            }
        });
        
        // Delete focused control point on key press.
        d3.select("body").on("keydown", () => {
            var code = d3.event.keyCode;
            
            if(this.focused >= 0 && (code === 8 || code === 46)) {
                this.transferFunction = this.transferFunction.removeControlPoint(this.focused, this.domain);
            }
        });
    }
    
    // Get the transfer function input domain. The range is fixed to [0,1].
    get domain() {
        return this._domain;
    }
    
    // Set the transfer function input domain. Both bounds should be greater than zero, because it is a log scale.
    set domain(interval) {
        this._domain = _.clone(interval);   // Clone interval for protection.
        
        // Plot scale matches domain. Clamp to prevent log scale issue.
        this.x = d3.scale.log().clamp(true)
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
        // X axis.
        var xA = d3.svg.axis()
                       .scale(this.x)
                       .ticks(5, "s");
        var yShift = this._innerHeight + this._dotExpanse;
        this.xAxis.attr("transform", "translate(" + this._axisWidth + "," + yShift + ")")
                  .call(xA);
        
        // Control dots.
        var controlPoints = this._transferFunction.controlPoints;
        var controlDots = this.controlDots.selectAll("circle")
                              .data(controlPoints);
                              
        controlDots.enter()
                   .append("circle")
                   .attr("class", "transferDot")
                   .attr("r", this._dotRadius);
        
        controlDots.attr("cx", d => this.x(d[0]))
                   .attr("cy", d => this.y(d[1]));
                   
        controlDots.exit()
                   .remove();
                   
        // Control delte markers.
        /*var controlDeleteMarkers = this.controlDots.selectAll("text")
                                       .data(controlPoints);
        
        controlDeleteMarkers.enter()
                            .append("text")
                            .attr("class", "transferDel")
                            .attr("text-anchor", "middle");
        
        controlDeleteMarkers.attr("x", d => this.x(d[0]))
                            .attr("y", d => this.y(d[1]) + (d[1] > .5 ? 4 * this._dotRadius : -this._dotRadius))
                            .text((d, i) => i > 0 && i < controlPoints.length - 1 ? "\u00D7" : "")
                            .on("click", (d, i) => {
                                this.transferFunction = this.transferFunction.removeControlPoint(i, this.domain);
                            });
                            
        controlDeleteMarkers.exit()
                            .remove();*/
        
        // Adjust control point coordinates on drag.
        controlDots.on("mousedown", (d, i) => {
            this.oldTransferFunction = this.transferFunction.removeControlPoint(i);
            this.transferFunction = this.oldTransferFunction;
            this.dragControlDot = true;
        });
        
        controlDots.on("mouseup", () => {
            if(this.dragControlDot) {
                this.dragControlDot = false;
                this.futureTransferFunction = null;
            }
        });
        
        // Remove future transfer function on dot hover.
        controlDots.on("mousemove", (d, i) => {
            this.futureTransferFunction = null;
        });
        
        // Focus hovered dot for possible deletion.
        controlDots.on("mouseover", (d, i) => {
            this.focused = i;
        });
        controlDots.on("mouseout", (d, i) => {
            this.focused = null;
        });
                   
        // Connecting line.
        var linePath = d3.svg.line()
                         .x((d) => this.x(d[0]))
                         .y((d) => this.y(d[1]))
                         .interpolate("linear");
        this.line.attr("d", linePath(this.transferFunction.controlPoints));
        this.futureLine.attr("d", this.futureTransferFunction ? linePath(this.futureTransferFunction.controlPoints) : []);
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
