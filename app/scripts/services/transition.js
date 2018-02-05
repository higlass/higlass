import * as PIXI from 'pixi.js';
// We need to import tweenManager in order to be able to update global tween
// manager like so: PIXI.tweenManager.update();
import tweenManager from 'k8w-pixi-tween';  // eslint-disable-line no-unused-vars

import { pubSub } from './';

const transition = (obj, propsTo, time = 160) => {
  const tween = PIXI.tweenManager.createTween(obj);

  pubSub.publish('app.startAnimation', true);

  tween.stop().clear();
  tween.time = time;
  tween.easing = PIXI.tween.Easing.inOutQuad();
  tween.to(propsTo);
  tween.loop = false;

  const startTransition = () => {
    tween
      .start()
      .on('end', () => {
        // Stop tick based animation for performance
        pubSub.publish('app.stopAnimation');
      });
  };

  // Wait for the next tick (i.e., animation frame) and start the transition
  pubSub.subscribe('app.tick', startTransition, 1);
};

export default transition;
