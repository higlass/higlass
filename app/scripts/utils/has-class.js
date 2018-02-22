const hasClass = (el, className) => (el.classList
  ? el.classList.contains(className)
  : !!el.className.match(new RegExp(`(\\s|^)${className}(\\s|$)`))
);

export default hasClass;
