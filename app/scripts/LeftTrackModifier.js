export class LeftTrackModifier {
    constructor(originalTrack) {
        this.scene = originalTrack.scene;

        this.originalTrack = originalTrack;
        this.pBase = new PIXI.Graphics();
        
        this.scene.removeChild(originalTrack.pBase);
        this.scene.addChild(this.pBase);

        this.moveToOrigin = new PIXI.Graphics();
        this.moveToOrigin.addChild(originalTrack.pBase);

        this.pBase.addChild(this.moveToOrigin);

        this.moveToOrigin.rotation = Math.PI / 2;
    }

    remove() {
        this.originalTrack.remove();

        this.pBase.clear();
        this.scene.removeChild(this.pBase);
    }

    setDimensions(newDimensions) {
        let reversedDimensions = [newDimensions[1], newDimensions[0]];

        this.originalTrack.setDimensions(reversedDimensions);
    }

    setPosition(newPosition) {
        this.originalTrack.setPosition(newPosition);

        this.originalTrack.pBase.position.x = -this.originalTrack.position[0];
        this.originalTrack.pBase.position.y = -this.originalTrack.position[1];

        this.moveToOrigin.scale.y = -1;
        this.moveToOrigin.position.x = this.originalTrack.position[0];
        this.moveToOrigin.position.y = this.originalTrack.position[1];
    }

    refXScale(_) {
        /**
         * Either get or set the reference xScale
         */
        if (!arguments.length) 
            return this.originalTrack._refYScale;

        this.originalTrack._refXScale = _;

        return this;
    }

    refYScale(_) {
        /**
         * Either get or set the reference yScale
         */
        if (!arguments.length) 
            return this.originalTrack._refXScale;

        this.originalTrack._refYScale = _;

        return this;
    }

    xScale(_) {
        /**
         * Either get or set the xScale
         */
        if (!arguments.length) 
            return this.originalTrack._xScale;

        this.originalTrack._yScale = _;

        return this;
    }

    yScale(_) {
        /**
         * Either get or set the yScale
         */
        if (!arguments.length)
            return this.originalTrack._yScale;

        this.originalTrack._xScale = _;

        return this;
    }

    draw() {
        this.originalTrack.draw();
    }

    zoomed(newXScale, newYScale, k=1, tx=0, ty=0, xPositionOffset=0, yPositionOffset=0) {
        this.xScale(newXScale);
        this.yScale(newYScale);

        this.originalTrack.refreshTiles();

        let offset = this.originalTrack._xScale(0) - k * this.originalTrack._refXScale(0);
        this.originalTrack.pMobile.position.x = offset + this.originalTrack.position[0];
        this.originalTrack.pMobile.position.y = this.originalTrack.position[1];

        this.originalTrack.pMobile.scale.x = k;
        this.originalTrack.pMobile.scale.y = 1;
    }

    refScalesChanged(refXScale, refYScale) {
        this.originalTrack.refScalesChanged(refYScale, refXScale);
    }
}
