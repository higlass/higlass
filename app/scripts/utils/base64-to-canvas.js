const base64ToCanvas = (base64, width, height) => {
  const canvas = document.createElement('canvas');

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      canvas.width = width || img.width;
      canvas.height = height || img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas);
    };

    img.onerror = (e) => {
      reject(e);
    };

    img.src = `data:image/png;base64,${base64}`;
  });
};

export default base64ToCanvas;
