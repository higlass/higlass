import {scaleLinear} from 'd3-scale';
import {tileProxy} from './TileProxy.js';
import {HorizontalLine1DPixiTrack} from './HorizontalLine1DPixiTrack.js';

export class VerticalLine1DPixiTrack extends HorizontalLine1DPixiTrack {
    constructor(scene, server, uid) {
        super(scene, server, uid);

        this.scene.removeChild(this.pBase);

        this.moveToOrigin = new PIXI.Graphics();
        this.moveToOrigin.addChild(this.pBase);

        this.scene.addChild(this.moveToOrigin);
        
        this.moveToOrigin.rotation = Math.PI / 2;
    }

    setDimensions(newDimensions) {
        let reversedDimensions = [newDimensions[1], newDimensions[0]];

        super.setDimensions(reversedDimensions);
    }

    setPosition(newPosition) {
        super.setPosition(newPosition);

        this.pBase.position.x = -this.position[0];
        this.pBase.position.y = -this.position[1];

        this.moveToOrigin.scale.y = -1;
        this.moveToOrigin.position.x = this.position[0];
        this.moveToOrigin.position.y = this.position[1];

        /*
        console.log('position[0]:', this.position[0], this.position[1]);
        this.pMain.position.x = this.position[0];
        this.pMain.position.y = this.position[1];

        this.setMask(this.position, this.dimensions);
        this.draw();
        */
    }

    refXScale(_) {
        /**
         * Either get or set the reference xScale
         */
        if (!arguments.length) 
            return this._refXScale;

        this._refYScale = _;

        return this;
    }

    refYScale(_) {
        /**
         * Either get or set the reference yScale
         */
        if (!arguments.length) 
            return this._refYScale;

        this._refXScale = _;

        return this;
    }

    xScale(_) {
        /**
         * Either get or set the xScale
         */
        if (!arguments.length) 
            return this._xScale;

        this._yScale = _;

        return this;
    }

    yScale(_) {
        /**
         * Either get or set the yScale
         */
        if (!arguments.length)
            return this._yScale;

        this._xScale = _;

        return this;
    }
}
