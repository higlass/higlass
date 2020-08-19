/**
 * Create a path-based symbol icon
 *
 * @method  createSymbolIcon
 * @author  Fritz Lekschas
 * @date    2016-10-09
 * @param   {Object}  el       D3 selected base element to where the symbols
 *   should be appended to.
 * @param   {String}  id       ID of the icon to be created.
 * @param   {Array}   paths    Array of path strings.
 * @param   {String}  viewBox  View box string.
 */
export default function createSymbolIcon(el, id, paths, viewBox) {
  const symbol = el.append('symbol').attr('id', id).attr('viewBox', viewBox);

  paths.forEach((d) =>
    symbol.append('path').attr('d', d).attr('fill', 'currentColor'),
  );
}
