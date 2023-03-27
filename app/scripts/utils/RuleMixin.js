import { Mixin } from './mixwith';

const RuleMixin = Mixin(
  (superclass) =>
    class extends superclass {
      constructor(context, options) {
        super(context, options);
        const { animate } = context;

        this.highlighted = false;
        this.animate = animate;

        this.MOUSEOVER_RADIUS = 4;

        this.pubSub = context.pubSub;

        this.pubSubs.push(
          this.pubSub.subscribe(
            'app.mouseMove',
            this.mouseMoveHandler.bind(this),
          ),
        );
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
    },
);

export default RuleMixin;
