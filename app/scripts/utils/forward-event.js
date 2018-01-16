import cloneEvent from './clone-event';

const forwardEvent = (event, target) => {
  target.dispatchEvent(cloneEvent(event));
};

export default forwardEvent;
