import PIXI from 'pixi.js';
import slugid from 'slugid';
import d3 from 'd3';
import boxIntersect from 'box-intersect';

export function TopGeneLabelsTrack() {
    let width = 200;
    let height = 15;
    let resizeDispatch = null;
    let xScale = d3.scale.linear();
    let zoomedXScale = d3.scale.linear();
    let zoomDispatch = null;
    let resolution = 256;
    let pixiStage = null;
    let inD = 0;
    let dataDomain = [];

    function tileId(tile) {
        // uniquely identify the tile with a string
        return tile.join(".") + '.' + tile.mirrored;
    }

    let chart = function(selection) {
        selection.each(function(d) {
            inD += 1;

            if (!('resizeDispatch' in d)) {
                d.resizeDispatch = resizeDispatch == null ? d3.dispatch('resize', 'close') : resizeDispatch;
            }

            if (!('translate' in d)) {
                d.translate = [0,0];
            }

            if (!('scale' in d)) {
                d.scale = 1;
            }

            if (!('tileGraphics' in d)) {
                d.tileGraphics = {};
            }

            if (!('pixiStage' in d)) {
                d.stage = pixiStage; 
            }

            if (!('pMain' in d)) {

                let pMain = new PIXI.Graphics();
                let pAbove = new PIXI.Graphics();
                let pMask = new PIXI.Graphics();

                pMask.beginFill();
                pMask.drawRect(0, 0, 1, 1);
                pMask.endFill();

                pAbove.addChild(pMain);
                pAbove.addChild(pMask);
                d.stage.addChild(pAbove);

                d.pAbove = pAbove;
                d.pMain = pMain;
                d.pMask = pMask;

                pMain.mask = pMask;
            }

            let zoomLevel = null;
            let dataWidth = null;
            let prevTranslate = null;
            let prevScale = null;
            let drawTile = null;
            let tileData = null;
            let allTiles = null;
                
            function redrawTile() {
                allTiles = d3.select(this).selectAll('.tile-g').data();
                allTiles.map((x) => { x.texts = []; });

                if (allTiles.length  == 0)
                    return;

                let minVisibleValue = Math.min(...allTiles.map((x) => x.importanceRange[0]));
                let maxVisibleValue = Math.max(...allTiles.map((x) => x.importanceRange[1]));

                dataWidth = allTiles[0].xRange[1] - allTiles[0].xRange[0];

                zoomLevel = allTiles[0].tilePos[0];
                let tileWidth = (allTiles[0].xRange[1] - allTiles[0].xRange[0]) / Math.pow(2, zoomLevel);
                let minXRange = Math.min(...allTiles.map((x) => x.tileXRange[0]));
                let maxXRange = Math.max(...allTiles.map((x) => x.tileXRange[1]));


                if (d.translate != null && d.scale != null) {
                    // change the zoom and scale before redrawing new elements
                    // helps to avoid flickering
                    zoomChanged(d.translate, d.scale);
                }

                let yScale = d3.scale.linear()
                .domain([0, Math.log(maxVisibleValue+1)])
                .range([0, 10]);

                drawTile = function(graphics, tile) {
                    let tileData = tile.data;
                    graphics.clear();

                    let tileWidth = (tile.xRange[1] - tile.xRange[0]) / Math.pow(2, tile.tilePos[0]);
                    // this scale should go from an index in the data array to 
                    // a position in the genome coordinates
                    graphics.lineStyle(0, 0x0000FF, 1);
                    graphics.beginFill(0xFF700B, 0.5);

                    while (graphics.children[0]) { graphics.removeChild(graphics.children[0]); };

                    tile.textGenes = [];

                    // keep track of which genes have already been drawn (genes may be duplicated in
                    // adjacent tiles to make sure they're drawn properly)
                    let drawnGenes = [].concat.apply([], allTiles.map((x) => { return x.textGenes; }));
                    let drawnGeneUids = {}
                    for (let i = 0; i < drawnGenes.length; i++) {
                        if (typeof drawnGenes[i] != 'undefined') {
                           drawnGeneUids[drawnGenes[i].gene.uid] = true;
                        }
                    }

                    for (let i = 0; i < tileData.length; i++) {
                        // if it's already drawn, don't draw it anymore
                        if (tileData[i].uid in drawnGeneUids)
                            continue;
                        drawnGeneUids[tileData[i].uid] = true;

                        let genomeOffset = +tileData[i].genomeTxStart - tileData[i].txStart;


                        let xStartPos = zoomedXScale(+tileData[i].txStart + genomeOffset);
                        let xEndPos = zoomedXScale(+tileData[i].txEnd + genomeOffset);

                        let xPos = (xEndPos + xStartPos) / 2;

                        //let yPos = -(d.height - yScale(tileData[i]));
                        let height = yScale(Math.log(+tileData[i].count+1))
                        let width = yScale(Math.log(+tileData[i].count+1));
                        let yPos = (d.height - height) / 2 + 5 ; //-(d.height - yScale(tileData[i]));

                        let text = new PIXI.Text(tileData[i].geneName, {font:"10px Arial", 
                                                                       fill:"red"});

                                         
                        tile.textGenes.push({ 'gene': tileData[i], 'text': text});

                        text.anchor.x = 0.5;
                        text.anchor.y = 1;

                        graphics.addChild(text)

                        text.position.x = xPos;
                        text.position.y = yPos - 2;

                        let drawn = {};

                        if (height > 0 && width > 0) {
                            if (xEndPos - xPos > 10) {
                                // only draw exons if we're zoomed in far enough to see them

                                let lineHeight = 2;
                                let exonHeight = 5;
                                let yPos = (d.height - lineHeight) / 2 + 5 ; //-(d.height - yScale(tileData[i]));
                                let width = xEndPos - xStartPos;

                                let yExonPos = (d.height - exonHeight) / 2 + 5;

                                graphics.drawRect(xStartPos, yPos, width, lineHeight);

                                let exonStarts = tileData[i].exonStarts.split(',');
                                let exonEnds = tileData[i].exonEnds.split(',');

                                for (let j = 0; j < exonStarts.length; j++) {
                                    let exonStart = +exonStarts[j] + genomeOffset;
                                    let exonEnd = +exonEnds[j] + genomeOffset;

                                    graphics.drawRect(zoomedXScale(exonStart), yExonPos, 
                                            zoomedXScale(exonEnd) - zoomedXScale(exonStart), exonHeight);
                                }
                                
                            } else {
                                graphics.drawRect(xPos, yPos, width, height);
                            }
                        }
                    }

                    // all gene objects along with the text objects labelling them
                    let allTextGenes = [].concat.apply([], allTiles.map((x) => { return x.textGenes; }));
                    let textGenesDict = {};
                    for (let i = 0; i < allTextGenes.length; i++) {
                        if (typeof allTextGenes[i] != 'undefined') {
                            if (allTextGenes[i].gene.uid in textGenesDict) {
                                allTextGenes[i].text.alpha = 0;
                                continue;
                            }
                            textGenesDict[allTextGenes[i].gene.uid] = allTextGenes[i]; 
                        }
                    }

                    let selectTextGenes = [];
                    for (let key in textGenesDict)
                        selectTextGenes.push(textGenesDict[key]);

                    let allBoxes = selectTextGenes.map((y) => { 
                                        let x = y.text;
                                        x.updateTransform();
                                        let b = x.getBounds();
                                        let box = [b.x, b.y, b.x + b.width, b.y + b.height];
                                        return box;
                                    });

                    let result = boxIntersect(allBoxes, function(i, j) {
                        if (+selectTextGenes[i].gene.count > +selectTextGenes[j].gene.count) {
                            selectTextGenes[j].text.alpha = 0; 
                        } else {
                            selectTextGenes[i].text.alpha = 0; 
                        }
                    });

                    // hide all overlapping texts
                }

                let shownTiles = {};

                for (let i = 0; i < allTiles.length; i++) {
                    shownTiles[allTiles[i].tileId] = true;
                    
                    if (allTiles[i].tileId in d.tileGraphics) {
                        d.pMain.removeChild(d.tileGraphics[allTiles[i].tileId]);
                        delete d.tileGraphics[allTiles[i].tileId];
                    }

                    for (let tileIdStr in d.tileGraphics) {
                        if (!(tileIdStr in shownTiles)) {
                            //we're displaying graphics that are no longer necessary,
                            //so we need to get rid of them
                            d.pMain.removeChild(d.tileGraphics[tileIdStr]);
                            delete d.tileGraphics[tileIdStr];
                        }
                    }

                    if (!(allTiles[i].tileId in d.tileGraphics)) {
                        // we don't have a graphics object for this tile
                        // so we need to create one
                         let newGraphics = new PIXI.Graphics();
                         drawTile(newGraphics, allTiles[i], zoomedXScale);
                         d.pMain.addChild(newGraphics)
                         d.tileGraphics[allTiles[i].tileId] = newGraphics
                    } 
                }

            }

            redrawTile.bind(this)();

            let localResizeDispatch = d.resizeDispatch;

            let slugId = d.uid + '.wiggle';
            //let slugId = slugid.nice();
            localResizeDispatch.on('resize.' + slugId, sizeChanged);
            localResizeDispatch.on('close.' + slugId, closeClicked);

            let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom') : zoomDispatch;
            localZoomDispatch.on('zoom.' + slugId, zoomChanged);

            function sizeChanged() {
                d.pMain.position.y = d.top;

                d.pMask.position.x = d.left;
                d.pMask.position.y = d.top;

                d.pMask.scale.x = d.width;
                d.pMask.scale.y = d.height;
            }

            function closeClicked() {
                localZoomDispatch.on('zoom.' + slugId, () => {});
                localResizeDispatch.on('resize.' + slugId, () => {});
                localResizeDispatch.on('close.' + slugId, () => {});
                d.stage.removeChild(d.pMain);
                delete d.pMain;
            }

            function zoomChanged(translate, scale) {
                sizeChanged();

                d.translate = translate;
                d.scale = scale;

                zoomedXScale = xScale.copy();
                zoomedXScale.domain(xScale.range()
                                          .map(function(x) { return (x - translate[0]) / scale })
                                          .map(xScale.invert))

                if (drawTile != null) {
                    for (let i = 0; i < allTiles.length; i++) {
                        let tileGraphics = d.tileGraphics[allTiles[i].tileId]
                        drawTile(tileGraphics, allTiles[i], zoomedXScale);
                    }
                }
            }

            sizeChanged();
        });
    }

    chart.width = function(_) {
        if (!arguments.length) return width;
        else width = _;
        return chart;
    }

    chart.height = function(_) {
        if (!arguments.length) return height;
        else height = _;
        return chart;
    }

    chart.resizeDispatch = function(_) {
        if (!arguments.length) return resizeDispatch;
        else resizeDispatch = _;
        return chart;
    }

    chart.xScale = function(_) {
        if (!arguments.length) return xScale;
        else xScale = _;
        return chart;
    }

    chart.zoomDispatch = function(_) {
        if (!arguments.length) return zoomDispatch;
        else zoomDispatch = _;
        return chart;
    }

    chart.pixiStage = function(_) {
        if (!arguments.length) return pixiStage;
        else pixiStage = _;
        return chart;
    }

    chart.width = function(_) {
        if (!arguments.length) return width;
        else width = _;
        return chart;
    }

    chart.dataDomain = function(_) {
        if (!arguments.length) return dataDomain;
        else dataDomain = _;
        return chart;
    }

    return chart;
}
