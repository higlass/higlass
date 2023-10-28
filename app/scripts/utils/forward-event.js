import cloneEvent from './clone-event';

/**
 * Forward an event by cloning and dispatching it.
 * @param {Event} event - Event to be forwarded.
 * @param {HTMLElement} target - Target HTML element for the event.
 */
const forwardEvent = (event, target) => {
  target.dispatchEvent(cloneEvent(event));
};

export default forwardEvent;
