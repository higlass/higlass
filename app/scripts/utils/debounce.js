/**
 * Debounce a function call
 *
 * @description
 * Function calls are delayed by `wait` milliseconds and only one out of
 * multiple function calls is executed.
 *
 * @note
 * Once webpack 2 with tree-shaking is supported I'd advocate to use lodash's
 * debounce method.
 *
 * @method  debounce
 * @author  Fritz Lekschas
 * @date    2017-01-14
 * @param   {Function}   func       Function to be debounced
 * @param   {Number}     wait       Number of milliseconds to debounce the
 *   function call.
 * @param   {Boolean}    immediate  If `true` function is not debounced.
 * @return  {Functiomn}             Debounced function.
 */
export const debounce = (func, wait, immediate) => {
  let timeout;

  const debounced = (...args) => {
    const later = () => {
      timeout = null;
      if (!immediate) {
        func(...args);
      }
    };

    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) {
      func(...args);
    }
  };

  debounce.cancel = () => {
    clearTimeout(timeout);
    timeout = null;
  };

  return debounced;
};

export default debounce;
