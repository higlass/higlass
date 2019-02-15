/**
 * Test whether a DOM element is the parent of another DOM element.
 *
 * @param {object} el - Potential child element.
 * @param {object} target - Target parent element which is tested to have `el`
 *   as a child.
 * @return  {Boolean}  If `true` `el` has `target` as a parent.
 */
const hasParent = (el, target) => {
  let _el = el;

  while (_el && _el !== target && _el.tagName !== 'HTML') {
    _el = _el.parentNode;
  }

  if (_el === target) {
    return true;
  }

  return false;
};

export default hasParent;
