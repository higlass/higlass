const stack = {};

/**
 * Publish an event.
 *
 * @param {string} event - Event type to be published.
 * @param {any} news - The news to be published.
 */
const publish = (event, news) => {
  if (!stack[event]) { return; }

  stack[event].forEach(listener => listener(news));
};

/**
 * Subscribe to an event.
 *
 * @param {string} event - Event name to subscribe to.
 * @param {function} callback - Function to be called when event of type `event`
 *   is published.
 * @return {object} Object with the event name and the callback. The object can
 *   be used to unsubscribe.
 */
const subscribe = (event, callback) => {
  if (!stack[event]) { stack[event] = []; }

  stack[event].push(callback);

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
const unsubscribe = (event, callback) => {
  if (typeof event === 'object') {
    event = event.event; // eslint-disable-line no-param-reassign
    callback = event.callback; // eslint-disable-line no-param-reassign
  }

  const id = stack[event].indexOf(callback);

  if (!stack[event]) { return; }
  if (id === -1 || id >= stack[event].length) { return; }

  stack[event].splice(id, 1);
};

const pubSub = {
  publish,
  subscribe,
  unsubscribe,
};

export default pubSub;
