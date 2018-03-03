const XMLNS = 'http://www.w3.org/2000/svg';

const hasClass = (el, className) => {
  if (el.namespaceURI === XMLNS) {
    const _class = el.getAttribute('class');
    return (
      _class && !!_class.match(new RegExp(`(\\s|^)${className}(\\s|$)`))
    );
  }

  if (el.classList) return el.classList.contains(className);

  return !!el.className.match(new RegExp(`(\\s|^)${className}(\\s|$)`));
};

export default hasClass;
