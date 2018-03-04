const NS = 'http://www.w3.org/2000/svg';

const createIcon = (iconDef) => {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('id', iconDef.id);
  svg.setAttribute('viewBox', iconDef.viewBox);

  iconDef.paths.forEach((d) => {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'currentColor');
    svg.appendChild(path);
  });

  return svg;
};

export default createIcon;
