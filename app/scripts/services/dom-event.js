/**
 * Supported event handlers.
 *
 * @type {object}
 */
const customEventHandlers = {};

/**
 * Get event handler.
 *
 * @param {string} eventName - Name of the event.
 * @return {function} Either a custom or generic event handler.
 */
const getEventHandler = (eventName, pubSub) => {
  if (customEventHandlers[eventName]) {
    return customEventHandlers[eventName];
  }
  return event => pubSub.publish(eventName, event);
};

/**
 * Stack of elements with registered event listeners.
 *
 * @type {object}
 */
const registeredEls = {};

/**
 * Unregister an event listener.
 *
 * @param {string} event - Name of the event to stop listening from.
 * @param {object} element - DOM element which we listened to.
 */
const unregister = (event, element) => {
  if (!registeredEls[event] && registeredEls[event] !== element) return;

  registeredEls[event].removeEventListener(
    event,
    registeredEls[event].__handler__
  );

  registeredEls[event] = undefined;
  delete registeredEls[event];
};

/**
 * Register an event listener.
 *
 * @param {string} event - Name of the event to listen to.
 * @param {object} newElement - DOM element which to listen to.
 */
const register = pubSub => (event, newElement, useCapture = false) => {
  if (!newElement || registeredEls[event] === newElement) return;

  if (registeredEls[event]) {
    unregister(registeredEls[event]);
  }

  registeredEls[event] = newElement;
  registeredEls[event].__handler__ = getEventHandler(event, pubSub);
  registeredEls[event].addEventListener(
    event, registeredEls[event].__handler__, useCapture
  );
};

/**
 * Public API.
 *
 * @type {object}
 */
const domEvent = pubSub => ({
  register: register(pubSub),
  unregister,
});

export default domEvent;
