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
 * @method debounce
 * @author Fritz Lekschas
 * @date   2017-01-14
 *
 * @template {any[]} Args
 * @param {(...args: Args) => void} func - Function to be debounced
 * @param {number} wait - Number of milliseconds to debounce the function call.
 * @param {boolean} immediate - If `true` function is not debounced.
 * @return {{ (...args: Args): void, cancel(): void }} Debounced function.
 */
export const debounce = (func, wait, immediate) => {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout;

  /** @param {Args} args */
  const debounced = (...args) => {
    const later = () => {
      timeout = undefined;
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

  debounced.cancel = () => {
    clearTimeout(timeout);
    timeout = undefined;
  };

  return debounced;
};

export default debounce;
