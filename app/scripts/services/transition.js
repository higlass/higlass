import * as PIXI from 'pixi.js';
// We need to import tweenManager in order to be able to update global tween
// manager like so: PIXI.tweenManager.update();
import tweenManager from 'k8w-pixi-tween';  // eslint-disable-line no-unused-vars

import { pubSub } from './';

/**
 * Factory function for canceling a transition.
 * @param   {object}  tween  Transition to be canceled. Needs to be the original tween object.
 * @return  {function}  Function which cancels the transtion when invoked.
 */
const cancel = tween => () => {
  tween.stop().clear();
  pubSub.publish('app.stopRepeatingAnimation', tween);
};

/**
 * Transition a PIXI object
 * @param   {object}  obj  PIXI object to be transitioned, e.g., `PIXI.Sprite`
 * @param   {object}  propsTo  Properties of the final transition state
 * @param   {number}  time  Transition time in millisencons
 * @return  {function}  Function to clear the transition
 */
const transition = (obj, propsTo, time = 160) => {
  const tween = PIXI.tweenManager.createTween(obj);

  pubSub.publish('app.startRepeatingAnimation', tween);

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
        pubSub.publish('app.stopRepeatingAnimation', tween);
      });
  };

  // Wait for the next tick (i.e., animation frame) and start the transition
  pubSub.subscribe('app.tick', startTransition, 1);

  return cancel(tween);
};

export default transition;
