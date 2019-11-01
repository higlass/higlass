import hasClass from './has-class';

const XMLNS = 'http://www.w3.org/2000/svg';

/**
 * Method to add a class name to an HTML or SVG element.
 * @param  {object}  el  HTML or SVG element to add a class to.
 * @param  {string}  className  The class name to be added.
 */
const addClass = (el, className) => {
  if (el.namespaceURI === XMLNS) {
    if (!hasClass(el, className)) {
      const _class = el.getAttribute('class') || '';
      el.setAttribute('class', `${_class} ${className}`);
    }
  } else if (el.classList) {
    el.classList.add(className);
  } else if (!hasClass(el, className)) {
    el.className += ` ${className}`;
  }
};

export default addClass;
