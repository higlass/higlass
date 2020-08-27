const componentToHex = (c) => {
  const hex = c.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
};

const rgbToHex = (r, g, b) =>
  `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;

export default rgbToHex;
