const NS = 'http://www.w3.org/2000/svg';

/**
 * Create an SVG icon.
 * @param   {object}  iconDef  Icon definition of the following form:
 *   ```
 *   {
 *     id: 'Icon identifier',
 *     viewBox: '0 0 50 50',
 *     paths: [
 *       'M10 10 H 90 V 90 H 10 L 10 10',
 *       'M20 20 H 10 V 10 H 20 L 20 20',
 *       ...
 *     ]
 *   }
 *   ```
 * @return  {object}  SVG element containing several paths defining the icon.
 */
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
