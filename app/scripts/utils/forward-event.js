import cloneEvent from './clone-event';

/**
 * Forward an event by cloning and dispatching it.
 * @param   {object}  event  Event to be forwarded.
 * @param   {object}  target  Target HTML element for the event.
 */
const forwardEvent = (event, target) => {
const newEvent = cloneEvent(event);
    if (event.type === 'mousewheel') {
        console.log('fede newEvent', target)
    }
  target.dispatchEvent(newEvent);
};

export default forwardEvent;
