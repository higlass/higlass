/**
 * Throttle and debounce a function call
 *
 * Throttling a function call means that the function is called at most every
 * `interval` milliseconds no matter how frequently you trigger a call.
 * Debouncing a function call means that the function is called the earliest
 * after `finalWait` milliseconds wait time where the function was not called.
 * Combining the two ensures that the function is called at most every
 * `interval` milliseconds and is ensured to be called with the very latest
 * arguments after after `finalWait` milliseconds wait time at the end.
 *
 * The following imaginary scenario describes the behavior:
 *
 * MS | interval=2 and finalWait=2
 * 01. y(f, 2, 2)(args_01) => f(args_01) call
 * 02. y(f, 2, 2)(args_02) => throttled call
 * 03. y(f, 2, 2)(args_03) => f(args_03) call
 * 04. y(f, 2, 2)(args_04) => throttled call
 * 05. y(f, 2, 2)(args_05) => f(args_05) call
 * 06. y(f, 2, 2)(args_06) => throttled call
 * 07. y(f, 2, 2)(args_07) => f(args_03) call
 * 08. y(f, 2, 2)(args_08) => throttled call
 * 09. nothing
 * 10. y(f, 2, 2)(args_10) => f(args_10) call from debouncing
 *
 * @param   {functon}  func - Function to be throttled and debounced
 * @param   {number}  interval - Throttle intevals in milliseconds
 * @param   {number}  finalWait - Debounce wait time in milliseconds
 * @return  {function} - Throttled and debounced function
 */
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

      setTimeout(() => {
        wait = false;
      }, interval);
    } else {
      blockedCalls++;
    }
  };

  return throttled;
};

export default throttleAndDebounce;
