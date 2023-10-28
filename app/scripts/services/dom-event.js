// @ts-nocheck
class DomEvent {
  constructor(pubSub) {
    /**
     * Supported event handlers.
     *
     * @type {object}
     */
    this.customEventHandlers = {};

    /**
     * Stack of elements with registered event listeners.
     *
     * @type {object}
     */
    this.registeredEls = {};
    this.pubSub = pubSub;
  }

  /**
   * Get event handler.
   *
   * @param {string} eventName - Name of the event.
   * @return {function} Either a custom or generic event handler.
   */
  getEventHandler(eventName) {
    if (this.customEventHandlers[eventName]) {
      return this.customEventHandlers[eventName];
    }
    return (event) => this.pubSub.publish(eventName, event);
  }

  /**
   * Unregister an event listener.
   *
   * @param {string} event - Name of the event to stop listening from.
   * @param {object} element - DOM element which we listened to.
   */
  unregister(event, element) {
    if (!this.registeredEls[event] && this.registeredEls[event] !== element)
      return;

    this.registeredEls[event].removeEventListener(
      event,
      this.registeredEls[event].__handler__,
    );

    this.registeredEls[event] = undefined;
    delete this.registeredEls[event];
  }

  /**
   * Register an event listener.
   *
   * @param {string} event - Name of the event to listen to.
   * @param {object} newElement - DOM element which to listen to.
   */
  register(event, newElement, useCapture = false) {
    if (!newElement || this.registeredEls[event] === newElement) {
      return;
    }

    if (this.registeredEls[event]) {
      this.unregister(this.registeredEls[event]);
    }

    this.registeredEls[event] = newElement;
    this.registeredEls[event].__handler__ = this.getEventHandler(event);
    this.registeredEls[event].addEventListener(
      event,
      this.registeredEls[event].__handler__,
      {
        capture: useCapture,
        passive: false,
      },
    );
  }
}

/**
 * Public API.
 *
 * @type {object}
 */
const domEvent = (pubSub) => new DomEvent(pubSub);

export default domEvent;
