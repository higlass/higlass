import { Mixin } from 'mixwith';
import { pubSub } from './services';

const RuleMixin = Mixin(superclass => class extends superclass {
  constructor(stage, options, animate) {
    super(stage, options);

    this.pubSubs.push(pubSub.subscribe('app.mouseMove', this.mouseMoveHandler.bind(this)));

    this.highlighted = false;
    this.animate = animate;

    this.MOUSEOVER_RADIUS = 4;
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    // console.log('position', this.position);
    this.pMain.position.x = this.position[0];
    this.pMain.position.y = this.position[1];
  }

  zoomed(newXScale, newYScale) {
    super.zoomed(newXScale, newYScale);

    this.draw();
  }

  /*
   * This function is for seeing whether this track should respond
   * to events at this mouse position.
   */
  respondsToPosition() {
    return this.highlighted;
  }
});

export default RuleMixin;
