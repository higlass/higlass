const GLOBAL_STACK = {
  __times: {}
};

/**
 * Subscribe to an event.
 * @param {string} event - Event name to subscribe to.
 * @param {function} callback - Function to be called when event of type
 *   `event` is published.
 * @param {number} times - Number of times the callback should called for the
 *   given event. The event listener will automatically be unsubscribed once
 *   the number of calls exceeds `times`.
 * @return {object} Object with the event name and the callback. The object
 *   can be used to unsubscribe.
 */
const subscribe = stack => (event, callback, times = Infinity) => {
  if (!stack[event]) {
    stack[event] = [];
    stack.__times[event] = [];
  }

  stack[event].push(callback);
  stack.__times[event].push(parseInt(times, 10) || Infinity);

  return { event, callback };
};

/**
 * Unsubscribe from event.
 *
 * @param {string|object} event - Event from which to unsubscribe or the return
 *   object provided by `subscribe()`.
 * @param {function} callback - Callback function to be unsubscribed. It is
 *   ignored if `id` is provided.
 */
const unsubscribe = stack => (event, callback) => {
  if (!stack[event]) return;

  if (typeof event === 'object') {
    event = event.event; // eslint-disable-line no-param-reassign
    callback = event.callback; // eslint-disable-line no-param-reassign
  }

  const id = stack[event].indexOf(callback);

  if (!stack[event]) return;
  if (id === -1 || id >= stack[event].length) return;

  stack[event].splice(id, 1);
  stack.__times[event].splice(id, 1);
};

/**
 * Publish an event.
 *
 * @param {string} event - Event type to be published.
 * @param {any} news - The news to be published.
 */
const publish = stack => (event, news) => {
  if (!stack[event]) return;

  const unsubscriber = unsubscribe(stack);

  stack[event].forEach((listener, i) => {
    listener(news);
    if (!(stack.__times[event][i] -= 1)) unsubscriber(event, listener);
  });
};

const create = (stack = { __times: {} }) => {
  if (!stack.__times) stack.__times = {};
  return {
    publish: publish(stack),
    subscribe: subscribe(stack),
    unsubscribe: unsubscribe(stack),
  };
};

export default create;

export const globalPubSub = create(GLOBAL_STACK);
