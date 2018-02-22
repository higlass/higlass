import hasClass from './has-class';

const addClass = (el, className) => {
  if (el.classList) el.classList.add(className);
  else if (!hasClass(el, className)) el.className += ` ${className}`;
};

export default addClass;
