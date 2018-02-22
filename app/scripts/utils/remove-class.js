import hasClass from './has-class';

const removeClass = (el, className) => {
  if (el.classList) {
    el.classList.remove(className);
  } else if (hasClass(el, className)) {
    const reg = new RegExp(`(\\s|^)${className}(\\s|$)`);
    el.className = el.className.replace(reg, ' ');
  }
};

export default removeClass;
