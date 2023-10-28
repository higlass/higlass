/**
 * @param {{ from: number, color: string }[]} steps
 * @param {number} width
 * @param {number} height
 * @param {number} fromX
 * @param {number} fromY
 * @param {number} toX
 * @param {number} toY
 */
const gradient = (
  steps,
  width = 1,
  height = 100,
  fromX = 0,
  fromY = 0,
  toX = 0,
  toY = 100,
) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  const grd = ctx.createLinearGradient(fromX, fromY, toX, toY);

  steps.forEach((step) => {
    grd.addColorStop(step.from, step.color);
  });

  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, width, height);

  return canvas;
};

export default gradient;
