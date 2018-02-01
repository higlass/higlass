const canvasLinearGradient = (width, height, stops) => {
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  const stopPoints = Object.keys(stops);

  for (let i = 0, n = stopPoints.length; i < n; i += 1) {
    gradient.addColorStop(parseFloat(stopPoints[i]), stops[stopPoints[i]]);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas;
};

export default canvasLinearGradient;
