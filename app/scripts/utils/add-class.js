import hasClass from './has-class';

const XMLNS = 'http://www.w3.org/2000/svg';

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
