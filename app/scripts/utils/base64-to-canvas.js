/**
 * Convert a base64 encoded image into a canvas object.
 * @param {string} base64 - Base64 string encoding the image.
 * @param {number} width - Custom width for the canvas object.
 * @param {number} height - Custom height for the canvas object.
 * @return {Promise<HTMLCanvasElement>} The converted canvas object
 */
const base64ToCanvas = (base64, width, height) => {
  const canvas = document.createElement('canvas');

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      canvas.width = width || img.width;
      canvas.height = height || img.height;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      context.drawImage(img, 0, 0);
      resolve(canvas);
    };

    img.onerror = () => {
      reject(new Error('Could not convert base64 to canvas'));
    };

    img.src = `data:image/png;base64,${base64}`;
  });
};

export default base64ToCanvas;
