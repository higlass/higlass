import $ from 'jquery';
import _ from 'lodash';
import d3 from 'd3';

export class MatrixView {
    constructor(parentElement, width, height, dataServer) {
        // Create and initialize canvas.
        this.canvas = document.createElement("canvas");
        parentElement.appendChild(this.canvas);
        this.canvas.width = width;
        this.canvas.height = height;

        // TODO: Correct for canvas high DPI screen case.

        this._dataServer = dataServer;
        this._dataSet = null;
        this._tileManager = null;

        // Mouse drag to view translation (pan).
        this._mouseDragged = false;
        this._mousePosition = null;
        $(this.canvas).on("mousedown", (event) => {
            this._mouseDragged = true;
            this._mousePosition = [event.clientX, event.clientY];
            
            // Switch to drag cursor.
            this.canvas.style.cursor = 'all-scroll';
        });
        $(this.canvas).on("mouseup", () => {
            this._mouseDragged = false;
            
            // Switch back to pointing cursor.
            this.canvas.style.cursor = 'pointer';   
        });
        $(this.canvas).on("mousemove", (event) => {
            if(this._mouseDragged) {
                var dX = event.clientX - this._mousePosition[0];
                var dY = event.clientY - this._mousePosition[1];

                if(this._tileManager) this._tileManager.translate(-dX, -dY, 0);
                
                this._mousePosition = [event.clientX, event.clientY];
            }
        });

        // Mouse wheel to view translation (zoom).
        $(this.canvas).on("mousewheel", (event) => {
            if(this._tileManager) {
                var mouseDelta = event.originalEvent.wheelDelta;
                var zoomDelta = .1 * mouseDelta / Math.abs(mouseDelta);
                this._tileManager.zoom(event.clientX, event.clientY, zoomDelta);
            }
        });
        $(window).on("mousewheel", (event) => {
            event.preventDefault(); // Prevent default scrolling behavior.
        });
        
        // Hand cursor.
        this.canvas.style.cursor = 'pointer';
    }

    get width() {
        return this.canvas.width;
    }

    set width(width) {
        this.canvas.width = width;
    }

    get height() {
        return this.canvas.height;
    }

    set height(height) {
        this.canvas.height = height;
    }

    get dataSet() {
        return this._dataSet;
    }

    set dataSet(dataSet) {
        this._dataSet = dataSet;
        this._tileManager = new TileManager(this._dataServer, dataSet, this.canvas.getContext("2d"));
    }
    
    // Delegate setting of transfer function to tile manager.
    set transfer(tF) {
        if(this._tileManager) this._tileManager.transfer = tF;
    }
    
    get transfer() {
        return this._tileManager ? this._tileManager.transfer : null;
    }

    paint() {
        if(this._tileManager) this._tileManager.focusOn();
    }
}

export class TileManager {

    // Construct from given data server and target data set name.
    constructor(dataServer, dataSet, context) {
        this.dataServer = dataServer;
        this.dataSet = dataSet;
        this.context = context;
        this.updateBuffer();

        // Assume empty data set until actual data set information arrives.
        this.dataSetInfo = new DataSetInfo(0, 0, 1, 0, 1);

        // Fetched tiles, or tiles in the process of being fetched.
        this.tiles = [];

        // Start with 0 coordinates as long as data set information is not known.
        //this.focusOn(new MatrixCoordinates(0, 0, 0), 0, 0);

        // TODO: allow for input focus coordinates, then ignore data set info, if possible.

        // Request data set information.
        this.dataServer.dataSetInfo(dataSet).then((info) => {
            this.dataSetInfo = info;

            // Focus on center of entire matrix.
            var zoom = Math.log2(info.tileSize);
            this.focusOn(new MatrixCoordinates(
                Math.floor(.5 * (info.minimum[0] + info.maximum[0])),
                Math.floor(.5 * (info.minimum[0] + info.maximum[0])),
                zoom,
                Math.floor(zoom)
            ));

            // Count transfer function. Initial function is identity.
            //this._transfer = (count) => count > 0 ? Math.log2(1 + Math.log2(1 + count)) : 0;
            this._transfer = (count) => count / info.maxDensity;
        });
    }

    // Initialize or update off-canvas buffer.
    updateBuffer() {
        var canvas = this.context.canvas;
        if(!this.buffer || this.buffer.width !== canvas.width || this.buffer.height !== canvas.height) {
            this.buffer = this.buffer || document.createElement("canvas");
            this.buffer.width = canvas.width;
            this.buffer.height = canvas.height;
            this.bufferContext = this.buffer.getContext("2d");
        }
    }

    // Set view coordinates and zoom level.
    focusOn(centerCoordinates) {
        this.updateBuffer();

        // Update port coordinates.
        if(centerCoordinates)
            this.centerCoordinates = centerCoordinates.constrained(this.dataSetInfo);

        // Prepare collection of desired tiles.
        this.requestTiles = [];

        // Request upper and lower zoom level tiles.
        this.queueTileRequests(this.centerCoordinates.upperZoom);
        this.queueTileRequests(this.centerCoordinates.upperZoom + 1);
        if(this.centerCoordinates.upperZoom - 1 >= Math.floor(Math.log2(this.dataSetInfo.tileSize)))
            this.queueTileRequests(this.centerCoordinates.upperZoom - 1);

        // Transfer old tiles.
        var oldTileMap = this.tileMap || {};
        this.tiles = [];
        this.tileMap = {};
        this.requestTiles.forEach(tile => {
            var tag = tile.toString();
            if(tag in oldTileMap) this.tiles.push(oldTileMap[tag]);
            else this.requestTile(tile);
        });
        this.tileMap = {};
        this.tiles.forEach(tile => this.tileMap[tile.toString()] = tile);

        // Repaint all tiles on focus change. Repaint single tiles as they come in.
        this.paint();
    }

    queueTileRequests(zoom) {
        var portWidth = this.context.canvas.width;
        var portHeight = this.context.canvas.height;

        // Dataset locations covered by port.
        let pixelSpan = globalPixelSpan(this.dataSetInfo, zoom);
        let tileSpan = globalTileSpan(this.dataSetInfo, zoom);
        let portHalvedWidth = Math.floor(.5 * portWidth) * pixelSpan;
        let portHalvedHeight = Math.floor(.5 * portHeight) * pixelSpan;

        let portMinX = this.centerCoordinates.x - portHalvedWidth;
        let portMaxX = this.centerCoordinates.x + portHalvedWidth;
        let portMinY = this.centerCoordinates.y - portHalvedHeight;
        let portMaxY = this.centerCoordinates.y + portHalvedHeight;

        let portPixelMinX = portMinX / pixelSpan;
        let portPixelMaxX = portMaxX / pixelSpan;
        let portPixelMinY = portMinY / pixelSpan;
        let portPixelMaxY = portMaxY / pixelSpan;

        // Store port bounds of active zoom level.
        if(zoom === this.centerCoordinates.upperZoom) {
            this.portMinX = portMinX;
            this.portMaxX = portMaxX;
            this.portMinY = portMinY;
            this.portMaxY = portMaxY;

            this.portPixelMinX = portPixelMinX;
            this.portPixelMaxX = portPixelMaxX;
            this.portPixelMinY = portPixelMinY;
            this.portPixelMaxY = portPixelMaxY;
        }

        // Tiles to be resolved / requested as top left corners, derived from covered port locations.
        let marginTiles = 2;    // Tiles added to sides to pre-fetch.
        let marginLocations = marginTiles * tileSpan;

        let tilesTopLeft = this.tileTopLeft(portMinX, portMinY, zoom);
        tilesTopLeft[0] -= marginLocations;
        tilesTopLeft[1] -= marginLocations;
        let tilesBottomRight = this.tileTopLeft(portMaxX, portMaxY, zoom);
        tilesBottomRight[0] += marginLocations;
        tilesBottomRight[1] += marginLocations;

        // Request tiles that are not present already.
        /*var xRequests = [];
         var yRequests = [];
         for(var i = tilesTopLeft[0]; i < tilesBottomRight[0]; i += tileSpan) xRequests.push(i);
         for(var i = tilesTopLeft[0]; i < tilesBottomRight[0]; i += tileSpan) yRequests.push(i);

         xRequests.forEach(x => yRequests.forEach(y => this.requestTile(x, y, x + tileSpan, y + tileSpan, activeZoom)));*/

        for(let i = tilesTopLeft[0]; i < tilesBottomRight[0]; i += tileSpan) {
            for(let j = tilesTopLeft[1]; j < tilesBottomRight[1]; j += tileSpan) {
                var requestTile = new ManagedTile(i, j, i + tileSpan, j + tileSpan, zoom);
                this.requestTiles.push(requestTile);
            }
        }
    }

    // Translate focus by given pixel and level units.
    translate(dX, dY, dZ) {
        var pixelSpan = globalPixelSpan(this.dataSetInfo, this.centerCoordinates.zoom);
        var newCoordinates = this.centerCoordinates
                .translate(dX * pixelSpan, dY * pixelSpan, dZ)
                .constrained(this.dataSetInfo);
        this.focusOn(newCoordinates);

        // Repaint all tiles.
        this.paint();
    }
    
    // Zoom at given mouse coordinate.
    zoom(mX, mY, dZ) {
        var pixelSpan = globalPixelSpan(this.dataSetInfo, this.centerCoordinates.zoom);
        
        // Translate mouse coordinates to center.
        var vcX = mX - .5 * this.buffer.width;
        var vcY = mY - .5 * this.buffer.height;
        
        // Determine mouse vector change to center, on scale.
        var cF = Math.pow(2, dZ);
        var cX = Math.round(cF * vcX - vcX);
        var cY = Math.round(cF * vcY - vcY);
        
        this.translate(cX, cY, dZ);
    }

    // Repaint all tiles.
    paint() {
        // Clear canvas.
        this.bufferContext.clearRect(0, 0, this.buffer.width, this.buffer.height);

        // Paint tiles.
        this.tiles.forEach(tile => this.paintTile(tile, false));

        this.paintBuffer();
    }

    paintBuffer() {
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);

        var zoomPart = this.centerCoordinates.zoom - this.centerCoordinates.upperZoom;

        // Switch to no interpolation when zoomPart > 2 (going beyond deepest zoom level).
        this.context.imageSmoothingEnabled = zoomPart < 2;

        var widthCut = Math.pow(.5, zoomPart) * this.buffer.width;
        var heightCut = Math.pow(.5, zoomPart) * this.buffer.height;

        // Transfer scaled buffer to canvas.
        this.context.drawImage(this.buffer,
            .5 * (this.buffer.width - widthCut), .5 * (this.buffer.height - heightCut),
            widthCut, heightCut,
            0, 0,
            this.context.canvas.width, this.context.canvas.height);
    }

    // Paint a single tile. Does not clear canvas.
    paintTile(tile, propagate) {
        var pixelSpan = globalPixelSpan(this.dataSetInfo, this.centerCoordinates.upperZoom);

        if(tile.imageData) {
            var tilePixelMinX = tile.minX / pixelSpan;
            var tilePixelMinY = tile.minY / pixelSpan;
            var tilePixelMaxX = tile.maxX / pixelSpan;
            var tilePixelMaxY = tile.maxY / pixelSpan;

            // Paint if there is an overlap of port and tile.
            if (!(tilePixelMaxX <= this.portPixelMinX || tilePixelMinX >= this.portPixelMaxX) &&
                !(tilePixelMaxY <= this.portPixelMinY || tilePixelMinY >= this.portPixelMaxY) &&
                tile.zoom === this.centerCoordinates.upperZoom) {

                // Translation of tile in canvas view.
                var tileCanvasMinX = tilePixelMinX - this.portPixelMinX;
                var tileCanvasMinY = tilePixelMinY - this.portPixelMinY;

                this.bufferContext.putImageData(tile.imageData, tileCanvasMinX, tileCanvasMinY);

                if(propagate) this.paintBuffer();

                // Debug.
                /*this.context.strokeStyle = 'blue';
                this.context.strokeRect(tileCanvasMinX, tileCanvasMinY, this.dataSetInfo.tileSize, this.dataSetInfo.tileSize);

                this.context.fillStyle = 'blue';
                this.context.font = "normal 16pt Helvetica";

                // Port center location.
                this.context.fillText(tile.minX + "," + tile.minY, tileCanvasMinX + 5, tileCanvasMinY + 20);*/
            }
        }

        // Debug.
        /*var width = this.context.canvas.width;
        var height = this.context.canvas.height;
        this.context.strokeStyle = 'red';
        this.context.strokeRect(1, 1, width - 1, height - 1);
        this.context.moveTo(.5 * width, 0);
        this.context.lineTo(.5 * width, height);
        this.context.stroke();
        this.context.moveTo(0, .5 * height);
        this.context.lineTo(width, .5 * height);
        this.context.stroke();

        this.context.fillStyle = 'red';
        this.context.font = "normal 16pt Helvetica";

        // Port center location.
        this.context.fillText(this.centerCoordinates.x + "," + this.centerCoordinates.y, .5 * width + 5, .5 * height + 20);

        // Port min location.
        this.context.fillText(this.portMinX + "," + this.portMinY, 5, 20);

        // Port max location.
        this.context.fillText(this.portMaxX + "," + this.portMaxY, width - 200, height - 5);*/
    }

    //requestTile(minX, minY, maxX, maxY, zoom) {
    requestTile(tile) {
        var minDataPos = this.dataSetInfo.minimum;
        var maxDataPos = this.dataSetInfo.maximum;

        // Only request tile if it covers part of the data set.
        if (!(tile.maxX <= minDataPos[0] || tile.minX >= maxDataPos[0]) &&
            !(tile.maxY <= minDataPos[1] || tile.minY >= maxDataPos[1])) {

            // Register new tile and request it to be filled, if tile has not been requested yet.
            if (!(tile.toString() in this.tileMap)) {
                this.tileMap[tile.toString()] = tile;
                this.tiles.push(tile);

                this.dataServer.tile(this.dataSet, tile.minX, tile.minY, tile.zoom).then(counts => {
                    tile.load(counts);
                    this.transformTile(tile);
                });
            }
        }
    }

    // Transform counts of all tiles.
    transform() {
        this.tiles.forEach(t => this.transformTile(t));
    }

    // Transform counts to image data.
    transformTile(tile) {
        tile.transform(this._transfer, this.dataSetInfo.maxDensity);
        this.paintTile(tile, true);
    }

    // Fetch tile that contains given coordinates, at given zoom level.
    tileAt(x, y, zoom) {
        var topLeft = this.tileTopLeft(x, y, zoom);
        return this.tileMap[topLeft[0] + "," + topLeft[1] + "," + zoom] || null;
    }

    // Determine identifying top left tile coordinates. (Truncate by resolution at power of two.)
    tileTopLeft(x, y, zoom) {
        var span = globalTileSpan(this.dataSetInfo, zoom);  //this.tileSpan(zoom);
        return [
            this.dataSetInfo.minimum[0] + Math.floor((x - this.dataSetInfo.minimum[0]) / span) * span,
            this.dataSetInfo.minimum[1] + Math.floor((y - this.dataSetInfo.minimum[1]) / span) * span
        ];  // Trunc to zoom level coordinates.
    }

    // Count transfer function property.
    get tranfer() {
        return this._transfer;
    }

    set transfer(f) {
        this._transfer = f;
        this.transform();   // Update tiles.
    }
}

function globalPixelSpan(dataInfo, zoom) {
    return Math.ceil(Math.pow(2, dataInfo.levels - zoom) * dataInfo.granularity);
}

function globalTileSpan(dataInfo, zoom) {
    return globalPixelSpan(dataInfo, zoom) * dataInfo.tileSize;
}

// Managed tile. Contains received tile counts and subsequent transformed values.
class ManagedTile {
    constructor(minX, minY, maxX, maxY, zoom) {
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
        this.zoom = zoom;

        // Values are null until a result from the
        this.counts = null;
        this.imageData = null;
    }

    // Load the given tile counts.
    load(counts) {
        this.counts = counts;

        if(this.counts) {
            // Setup image data.
            var tileSize = Math.sqrt(counts.length);
            this.imageData = new ImageData(tileSize, tileSize);

            // Set alpha channel to 1.
            // Warning: this avoids an alpha pre-multiplication when writing the image data back to canvas.
            var tileArray = this.imageData.data;
            for (var i = 3; i < tileArray.length; i += 4) tileArray[i] = 255;
        }
    }

    // Transform counts to image data.
    transform(transferFunction, maxDensity) {
        // Transform if counts are available.
        if(this.counts && this.counts.length > 0) {
            var tileArray = this.imageData.data;
            var maxTransfer = transferFunction(maxDensity);
            for (var i = 0; i < this.counts.length; i++) {
                var intensity = transferFunction(this.counts[i]);   // / maxTransfer;   // Assume transfer function does proper normalization to [0,1].
                var discretized = Math.floor(255 * (1 - intensity));

                if(!heatedObjectMap[discretized]) {
                    console.log("Intensity: " + intensity);
                    console.log("Count: " + this.counts[i]);
                    console.log("Discretized: " + discretized);
                }

                // Set pixel channels. Apply a heat object color map.
                let aI = 4 * i;
                tileArray[aI]   = heatedObjectMap[discretized][0];   // Red.
                tileArray[aI+1] = heatedObjectMap[discretized][1];   // Green.
                tileArray[aI+2] = heatedObjectMap[discretized][2];   // Blue.
                // Alpha channel has already been filled.
            }
        }
    }

    equals(that) {
        return this.minX === that.minX &&
            this.minY === that.minY &&
            this.maxX === that.maxX &&
            this.maxY === that.maxY &&
            this.zoom === that.zoom;
    }

    toString() {
        return this.minX + "," + this.minY + "," + this.zoom;
    }
}

// Detailed information about a data set.
class DataSetInfo {
    constructor(minimum, maximum, maxWidth, tileSize, granularity, levels, maxDensity) {
        this.minimum     = minimum;                     // Minimum loci indices (inclusive).
        this.maximum     = maximum;                     // Maximum loci indices (exclusive).
        this.size        = [maximum[0] - minimum[0],
                            maximum[1] - minimum[1]];   // Number of loci, at smallest level.
        this.maxWidth    = maxWidth;                    // Max power of two that contains size.
        this.tileSize    = tileSize;                    // Number of sub divisions (per axis) of a tile.
        this.granularity = granularity;                 // Number of loci spannend by smallest bin.
        this.levels      = levels;                      // Number of loci aggregation levels. (Power of two, e.g., 10 levels => 1024 loci.)
        this.maxDensity  = maxDensity;                  // Maximum contact density, per locus squared. Assume minimum contact density is zero.
    }
}

// Matrix coordinates.
export class MatrixCoordinates {
    constructor(x, y, zoom, upperZoom) {
        this.x = x;
        this.y = y;
        this.zoom = zoom;              // Floating zoom level.
        this.upperZoom = upperZoom;    // Active zoom level.
    }

    toString() {
        return this.x + "," + this.y + "," + this.zoom;
    }

    // Translate coordinates.
    translate(dX, dY, dZoom) {
        return new MatrixCoordinates(this.x + dX, this.y + dY, this.zoom + dZoom);
    }

    // Constrain coordinates to data set dimensions.
    constrained(dataSetInfo) {
        let zoom = Math.max(this.zoom, Math.floor(Math.log2(dataSetInfo.tileSize)));
        
        return new MatrixCoordinates(
            Math.min(Math.max(this.x, dataSetInfo.minimum[0]), dataSetInfo.maximum[0]),
            Math.min(Math.max(this.y, dataSetInfo.minimum[1]), dataSetInfo.maximum[1]),
            zoom,   //Math.min(Math.max(this.zoom, Math.floor(Math.log2(dataSetInfo.tileSize))), dataSetInfo.levels)
            Math.min(Math.floor(zoom), dataSetInfo.levels)
        );
    }
}

// Data server layer specification. Functions return promises.
export class DataServer {
    // List of available data sets, by id.
    dataSets() {
        return null;
    }

    // Information about given data set. Returns Promise<DataSetInfo>
    dataSetInfo(dataSet) {
        return null;
    }

    // Request tile density at given position (absolute at top left). Returns Promise<Uint32Array>
    tile(dataSet, xPos, yPos, level) {
        return null;
    }
}

// Client-side server driver, for testing purposes.
export class FileServer extends DataServer {

    constructor(baseURL, mirrorUpperTriangle) {
        super();

        this.baseURL = baseURL;
        this.mirrorUpperTriangle = mirrorUpperTriangle || false;
        this.info = null;
    }

    dataSets() {
        // List of tile data sets present in the jsons folder.
        var folders = ["chr1_5kb"];     //["5k", "512k", "512k_dense"];

        return new Promise((resolve, reject) => resolve(folders));
    }

    // Respond to test data set, error for other data set requests.
    dataSetInfo(dataSet) {
        var that = this;
        return $.getJSON(this.baseURL + "/" + dataSet + "/tile_info.json").then(
            (tileInfo) => {
                that.info = new DataSetInfo(
                    tileInfo.min_pos,
                    tileInfo.max_pos,
                    tileInfo.max_width,
                    tileInfo.bins_per_dimension,
                    tileInfo.data_granularity,
                    tileInfo.max_zoom + Math.log2(tileInfo.bins_per_dimension),
                    tileInfo.max_value
                );

                console.log(that.info);

                return that.info;
            }
        );
    }

    // Generate tile information.
    tile(dataSet, xPos, yPos, zoom) {
        var pixelSpan = globalPixelSpan(this.info, zoom);
        var tileSpan = globalTileSpan(this.info, zoom);

        var tileZoom = zoom - Math.log2(this.info.tileSize);
        var tileX = (xPos - this.info.minimum[0]) / tileSpan;
        var tileY = (yPos - this.info.minimum[1]) / tileSpan;
        
        // Swap tile coordinates when mirroring the upper triangle.
        var mirrored = this.mirrorUpperTriangle && tileX > tileY;
        if(mirrored) {
            var swap = tileX;
            tileX = tileY;
            tileY = swap;
        }

        return $.getJSON(this.baseURL + "/" + dataSet + "/" + tileZoom + "/" + tileX + "/" + tileY + ".json").then(
            (tile) => {
                var matrix = null;

                // Convert count to density of loci area. Use bins as minimum unit to mitigate floating point errors.
                var pixelWidth = pixelSpan / this.info.granularity;
                var pixelArea = pixelWidth * pixelWidth;

                // Dense tile format.
                if(isFinite(tile[0])) {
                    matrix = new Float64Array(tile);

                    // Normalize count to bin density.
                    for(let i = 0; i < matrix.length; i++) matrix[i] /= pixelArea;
                }
                // Sparse tile format.
                else {
                    matrix = new Float64Array(this.info.tileSize * this.info.tileSize);
                    tile.forEach(cell => {
                        var cX = Math.floor(cell.pos[0] - xPos) / pixelSpan;
                        var cY = Math.floor(cell.pos[1] - yPos) / pixelSpan;

                        var mP = cX + cY * this.info.tileSize;  // Matrix x,y to flat coordinate.
                        matrix[mP] = cell.count / pixelArea;    // Normalize count to bin density.
                    });
                }
                
                
                // Diagonal tile is mirrored.
                if(tileX === tileY) {
                    var matrixDim = Math.sqrt(matrix.length);
                    for(let i = 0; i < matrixDim; i++) for(let j = 0; j < i; j++)
                        matrix[matrixDim * j + i] = matrix[matrixDim * i + j];
                }
                
                // Transpose matrix for mirrored upper triangle.
                if(mirrored) {
                    var matrixDim = Math.sqrt(matrix.length);
                    var swap;
                    for(let i = 0; i < matrixDim; i++) for(let j = 0; j < i; j++) {
                        swap = matrix[matrixDim * i + j];
                        matrix[matrixDim * i + j] = matrix[matrixDim * j + i];
                        matrix[matrixDim * j + i] = swap;
                    }
                }

                return matrix;
            },
            (error) => {
                return null;
            }
        );
    }
}

// Client-side server driver, for testing purposes.
export class DataServerDriver extends DataServer {

    constructor() {
        super();
    }

    dataSets() {
        return new Promise((resolve, reject) => resolve(["test"]));
    }

    // Respond to test data set, error for other data set requests.
    dataSetInfo(dataSet) {
        return new Promise((resolve, reject) => {
            if(dataSet === "test") {
                resolve(new DataSetInfo(
                    DataServerDriver.MINIMUM,
                    DataServerDriver.MAXIMUM,
                    DataServerDriver.TILE_SIZE,
                    DataServerDriver.GRANULARITY,
                    DataServerDriver.LEVELS,
                    DataServerDriver.MAX_DENSITY
                ));
            } else {
                reject(Error("Data set information could not be retrieved"));
            }
        });
    }

    // Generate tile information.
    tile(dataSet, xPos, yPos, zoom) {
        let pixelSpan = Math.pow(2, DataServerDriver.LEVELS - zoom);
        let waveFactor = 2 * Math.PI * DataServerDriver.WAVES / DataServerDriver.MAXIMUM;

        let matrix = new Uint32Array(DataServerDriver.TILE_SIZE * DataServerDriver.TILE_SIZE);
        for(let i = 0; i < matrix.length; i++) {
            var x = xPos + (i % DataServerDriver.TILE_SIZE) * pixelSpan;
            var y = yPos + Math.floor(i / DataServerDriver.TILE_SIZE) * pixelSpan;

            // Sinus wave.
            matrix[i] = .25 * (Math.sin(waveFactor * x) + 1 + Math.sin(waveFactor * y) + 1) * DataServerDriver.MAX_DENSITY;
        }
        var flat32 = matrix;

        return new Promise((resolve, reject) => resolve(flat32));
    }
}
DataServerDriver.MINIMUM      = 0;
DataServerDriver.MAXIMUM      = 1048576;     // Total size of data set.
DataServerDriver.TILE_SIZE    = 256;         // Size of served tiles.
DataServerDriver.GRANULARITY  = 1;           // Identity.
DataServerDriver.LEVELS       = 20;          // Zoom level of data set. (log2 SIZE - log2 TILE_SIZE)
DataServerDriver.MAX_DENSITY  = 1000000;     // Maximum frequency count for loci pair.
DataServerDriver.WAVES        = 20;          // Number of sinusoids to append in the entire data set.

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