const base64ToCanvas = (base64, w, h) => {
  const canvas = document.createElement('canvas');

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };

    img.onerror = (e) => {
      reject(e);
    };

    img.src = `data:image/png;base64,${base64}`;
  });
};

export default base64ToCanvas;
