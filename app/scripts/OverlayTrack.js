import PixiTrack from './PixiTrack';

// Services
import { tileProxy } from './services';

// Utils
import { colorToHex } from './utils';

const GENE_RECT_WIDTH = 1;
const GENE_RECT_HEIGHT = 10;
const MAX_TEXTS = 20;

export class OverlayTrack extends PixiTrack {
  constructor(scene, options, animate) {
    super(scene, options);

    //console.log('options:', options);

    this.options = options || {};
    //console.log('this.options:', this.options);
    this.drawnRects = {};
  }

  draw() {
    super.draw();
    let graphics = this.pMain;
    const fill = colorToHex(this.options.fillColor ? this.options.fillColor : 'blue');

    graphics.clear();
    graphics.beginFill(fill, 0.3);

    //console.log('_xScale', this._xScale.range());

    for (let i = 0; i < this.options.orientationsAndPositions.length; i++) {
      let orientation = this.options.orientationsAndPositions[i].orientation;
      let position = this.options.orientationsAndPositions[i].position;

      /*
      console.log('this.position:', this.position);
      console.log('position.left:', position.left);
      */

      if (orientation === '1d-horizontal') {
        let xPos = this.position[0] + position.left + 
          this._xScale(this.options.extent[0][0]);
        let yPos = this.position[1] + position.top;
        let height = position.height;
        let width = this._xScale(this.options.extent[0][1]) - 
          xPos + position.left + this.position[0];

        /*
        console.log('top:', yPos);
        console.log('height:', position.height);
        console.log('yPos:', yPos);
        console.log('width:', width);
        console.log('height:', height);
        */

        graphics.drawRect(xPos, yPos, width, height);
      }

        /*
      console.log('orientation:', orientation);
      console.log('position:', position);
      console.log('this.extent', this.extent);
      */
    }
  }

  zoomed(newXScale, newYScale) {
    this.xScale(newXScale);
    this.yScale(newYScale);

    this.draw();
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    this.draw();
  }

  setDimensions(newDimensions) {
    super.setDimensions(newDimensions);

    this.draw();
  }

  exportSVG() {
    //TODO: implement me
  }
}

export default OverlayTrack;
