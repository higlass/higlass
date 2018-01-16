const cloneEvent = event => new event.constructor(event.type, event);

export default cloneEvent;
