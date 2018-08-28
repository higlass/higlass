import { Mixin } from './mixwith';

const RuleMixin = Mixin(superclass => class extends superclass {
  constructor(pubSub, stage, options, animate) {
    super(pubSub, stage, options);

    this.highlighted = false;
    this.animate = animate;

    this.MOUSEOVER_RADIUS = 4;

    // this.pubSubs.push(
    //   this.pubSub.subscribe(
    //     'app.mouseMove', this.defaultMouseMoveHandler.bind(this)
    //   )
    // );
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

  respondsToPosition() {
    return this.highlighted;
  }
});

export default RuleMixin;
