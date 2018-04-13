/**
 * Convert a 1D numerical array into a canvas image
 * @param   {Float32Array}  pixData  1D data array
 * @param   {number}  w  Width
 * @param   {number}  h  Height
 * @return  {object}  Canvas object
 */
const tileToCanvas = (pixData, w = 256, h = 256) => {
  const canvas = document.createElement('canvas');

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const pix = new ImageData(pixData, canvas.width, canvas.height);

  ctx.putImageData(pix, 0, 0);

  return canvas;
};

export default tileToCanvas;
