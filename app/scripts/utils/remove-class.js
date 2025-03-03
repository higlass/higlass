import hasClass from './has-class';

const XMLNS = 'http://www.w3.org/2000/svg';

/**
 * Remove a class from an HTML or SVG element.
 * @param {Element} el - HTML or SVG element.
 * @param {string} className  Class name to be removed.
 */
const removeClass = (el, className) => {
  const reg = new RegExp(`(\\s|^)${className}(\\s|$)`);

  if (el.namespaceURI === XMLNS) {
    const _class = el.getAttribute('class') || '';
    el.setAttribute('class', _class.replace(reg, ' '));
  } else if (el.classList) {
    el.classList.remove(className);
  } else if (hasClass(el, className)) {
    el.className = el.className.replace(reg, ' ');
  }
};

export default removeClass;
