/**
 * Clone an event by invoking the source event's constructor and passing in
 *   the source event.
 * @param   {object}  event  Source event to be cloned.
 * @return  {object}  Cloned event
 */
const cloneEvent = (event) => {
  const newEvent = new event.constructor(event.type, event);
  newEvent.sourceUid = event.sourceUid;
  newEvent.forwarded = event.forwarded;

  return newEvent;
};

export default cloneEvent;
