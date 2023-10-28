/**
 * Add an event listener that fires only once and auto-removes itself
 *
 * @template {keyof HTMLElementEventMap} K
 *
 * @param {HTMLElement} element - DOM element to assign listener to.
 * @param {K} eventName - Event name to listen to.
 * @param {(event: HTMLElementEventMap[K]) => void} f - Event callback function.
 */
const addEventListenerOnce = (element, eventName, f) => {
  /** @type {(event: HTMLElementEventMap[K]) => void} */
  const callback = (event) => {
    f(event);
    element.removeEventListener(eventName, callback);
  };
  element.addEventListener(eventName, callback);
};

export default addEventListenerOnce;
