const throttleAndDebounce = (func, interval, finalWait) => {
  let timeout;
  let blockedCalls = 0;

  const reset = () => {
    timeout = null;
  };

  const debounced = (...args) => {
    const later = () => {
      // Since we throttle and debounce we should check whether there were
      // actually multiple attempts to call this function after the most recent
      // throttled call. If there were no more calls we don't have to call
      // the function again.
      if (blockedCalls > 0) {
        func(...args);
        blockedCalls = 0;
      }
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, finalWait);
  };

  debounced.cancel = () => {
    clearTimeout(timeout);
    reset();
  };

  debounced.immediate = (...args) => {
    func(...args);
  };

  let wait = false;
  const throttled = (request, ...args) => {
    if (!wait) {
      func(...args);
      debounced(...args);

      wait = true;
      blockedCalls = 0;

      setTimeout(() => { wait = false; }, interval);
    } else {
      blockedCalls++;
    }
  };

  return throttled;
};

export default throttleAndDebounce;
