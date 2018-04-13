/**
 * Clone an event by invoking the source event's constructor and passing in
 *   the source event.
 * @param   {object}  event  Source event to be cloned.
 * @return  {object}  Cloned event
 */
const cloneEvent = event => new event.constructor(event.type, event);

export default cloneEvent;
