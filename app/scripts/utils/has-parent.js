/**
 * Test whether a DOM element is the parent of another DOM element.
 *
 * @param {HTMLElement} el - Potential child element.
 * @param {HTMLElement} target - Target parent element which is tested to have `el` as a child.
 * @return {boolean}  If `true` `el` has `target` as a parent.
 */
const hasParent = (el, target) => {
  /** @type {HTMLElement | null} */
  let _el = el;

  while (_el && _el !== target && _el.tagName !== 'HTML') {
    // @ts-expect-error - we know ParentElement is also DOM or null
    _el = _el.parentNode;
  }

  if (_el === target) {
    return true;
  }

  return false;
};

export default hasParent;
