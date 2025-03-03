/**
 * Clone an event by invoking the source event's constructor and passing in the source event.
 *
 * @template {Event & { sourceUid?: string, forwarded?: boolean }} TEvent
 * @param {TEvent} event - Source event to be cloned.
 * @return {TEvent} Cloned event
 */
const cloneEvent = (event) => {
  if (!(event instanceof Event)) {
    throw new Error('Event must be an instance of Event');
  }
  // @ts-expect-error - TS doesn't know about the constructor property.
  const newEvent = new event.constructor(event.type, event);
  newEvent.sourceUid = event.sourceUid;
  newEvent.forwarded = event.forwarded;

  return newEvent;
};

export default cloneEvent;
