/**
 * Convert a HEX string into a HEX integer. E.g., #FF0000 is translated to
 *   16711680.
 * @param   {string}  str  HEX string
 * @return  {integer}  HEX number
 */
const hexStrToInt = (str) => parseInt(str.replace(/^#/, ''), 16);

export default hexStrToInt;
