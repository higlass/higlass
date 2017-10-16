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
 * @return {object} Object with the event name and index of the callback
 *   function on the event stack. The object can be used to unsubscribe.
 */
const subscribe = (event, callback) => {
  if (!stack[event]) {
    stack[event] = [];
  }

  return {
    event,
    id: stack[event].push(callback) - 1,
  };
};

/**
 * Unsubscribe from event.
 *
 * @param {string|object} event - Event from which to unsubscribe or the return
 *   object provided by `subscribe()`.
 * @param {function} callback - Callback function to be unsubscribed. It is
 *   ignored if `id` is provided.
 * @param {int} id - Index of the callback function to be removed from the
 *   event stack. The index is returned by `subscribe()`.
 */
const unsubscribe = (event, callback, id) => {
  let eventName = event;
  let listenerId = id;

  if (typeof event === 'object') {
    eventName = event.event;
    listenerId = event.id;
  } else {
    listenerId = typeof id !== 'undefined' ? id : stack[eventName].indexOf(callback);
  }

  if (!stack[eventName]) { return; }
  if (listenerId === -1 || listenerId >= stack[eventName].length) { return; }

  stack[eventName].splice(listenerId, 1);
};

const pubSub = {
  publish,
  subscribe,
  unsubscribe,
};

export default pubSub;
