import {scaleLinear} from 'd3-scale';
import {tileProxy} from './TileProxy.js';
import {HorizontalTiled1DPixiTrack} from './HorizontalTiled1DPixiTrack.js';

export class HorizontalLine1DPixiTrack extends HorizontalTiled1DPixiTrack {
    constructor(scene, server, uid) {
        super(scene, server, uid);

    }

    areAllVisibleTilesLoaded() {
        
        // we don't need to wait for any tiles to load before 
        // drawing
        //
        return true;
    }

    initTile(tile) {
        /**
         * Create whatever is needed to draw this tile.
         */
         
        let graphics = tile.graphics;
        tile.textGraphics = new PIXI.Graphics();
        //tile.text = new PIXI.Text(tile.tileData.zoomLevel + "/" + tile.tileData.tilePos.join('/') + '/' + tile.mirrored, 

        tile.text = new PIXI.Text(tile.tileData.zoomLevel + "/" + tile.tileData.tilePos.join('/'), 
                              {fontFamily : 'Arial', fontSize: 32, fill : 0xff1010, align : 'center'});

        //tile.text.y = 100;
        tile.textGraphics.addChild(tile.text);

        tile.text.anchor.x = 0.5;
        tile.text.anchor.y = 0.5;
        
    
        graphics.addChild(tile.textGraphics);

        this.drawTile(tile);
    }

    destroyTile(tile) {

    }

    drawTile(tile) {
        super.drawTile(tile);

        console.log('tile:', tile);
        if (!tile.graphics)
            return;

        let graphics = tile.graphics;

        let {tileX, tileWidth} = this.getTilePosAndDimensions(tile.tileData.zoomLevel, tile.tileData.tilePos);
        let tileData = tile.tileData;

        graphics.clear();

        // this scale should go from an index in the data array to
        // a position in the genome coordinates
        let tileXScale = scaleLinear().domain([0, tileData.length])
        .range([tileX,tileX + tileWidth]);


        graphics.lineStyle(1, 0x0000FF, 1);
       // graphics.beginFill(0xFF700B, 1);
        let j = 0;

        for (let i = 0; i < tileData.length; i++) {


            let xPos = zoomedXScale(tileXScale(i));
            let height = yScale(tileData[i])
            let width = zoomedXScale(tileXScale(i+1)) - zoomedXScale(tileXScale(i));

           if(j == 0){
                graphics.moveTo(xPos, d.height - d.height*height);
                j++;
            }
            graphics.lineTo(zoomedXScale(tileXScale(i+1)), d.height - d.height*yScale(tileData[i+1]));
        }
    }

}
