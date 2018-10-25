/**
 * Add an event listener that fires only once and auto-removes itself
 * @param   {object}  element  DOM element to assign listener to.
 * @param   {string}  eventName  Event name to listen to.
 * @param   {function}  f  Event callback function.
 */
const addEventListenerOnce = (element, eventName, f) => {
  const callback = (event) => {
    f(event);
    element.removeEventListener(eventName, callback);
  };
  element.addEventListener(eventName, callback);
};

export default addEventListenerOnce;
