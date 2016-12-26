import {Track} from './Track.js';
//import {LRUCache} from './lru.js';

export class PixiTrack extends Track {
    constructor(scene) {
        /**
         * @param scene: A PIXI.js scene to draw everything to.
         * @param xScale: A scale for placing points (can be null if this is vertical track)
         * @param yScale: A scale for placing graphics (can be null if this is a horizontal track)
         */
        super();

        // the PIXI drawing areas
        // pMain will have transforms applied to it as users scroll to and fro
        this.scene = scene;

        this.pBase = new PIXI.Graphics();

        this.pMask = new PIXI.Graphics();
        this.pMain = new PIXI.Graphics();

        this.scene.addChild(this.pBase);

        this.pBase.addChild(this.pMain);
        this.pBase.addChild(this.pMask);

        this.pBase.mask = this.pMask;

        // pMobile will be a graphics object that is moved around
        // tracks that wish to use it will replace this.pMain with it
        this.pMobile = new PIXI.Graphics();
        this.pBase.addChild(this.pMobile);
    }

    setPosition(newPosition) {
        this.position = newPosition;

        this.setMask(this.position, this.dimensions);
    }

    setDimensions(newDimensions) {
        super.setDimensions(newDimensions);

        this.setMask(this.position, this.dimensions);
    }

    setMask(position, dimensions) {
        this.pMask.clear();
        this.pMask.beginFill();
        this.pMask.drawRect(position[0], position[1], dimensions[0], dimensions[1]);
        this.pMask.endFill();

    }

    remove() {
        /**
         * We're going to destroy this object, so we need to detach its
         * graphics from the scene
         */
        this.pBase.clear();
        this.scene.removeChild(this.pBase);
    }


    draw() {
        /**
         * Draw all the data associated with this track
         */

        let graphics = this.pMain;

        graphics.clear();
        graphics.lineStyle(0, 0x0000FF, 1);
        graphics.beginFill(0xFF700B, 1);

        this.pMain.drawRect(this.position[0], this.position[1], 
                            this.dimensions[0], this.dimensions[1]);
    }
}
