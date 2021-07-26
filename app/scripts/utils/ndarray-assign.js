const ndarrayAssign = (target, source) => {
  const numSource = +source;
  const isScalar = !Number.isNaN(numSource);

  if (isScalar) {
    if (target.dimension === 1) {
      for (let i = 0; i < target.shape[0]; ++i) {
        target.set(i, numSource);
      }
    } else {
      for (let i = 0; i < target.shape[0]; ++i) {
        for (let j = 0; j < target.shape[1]; ++j) {
          target.set(i, j, numSource);
        }
      }
    }
  } else {
    const ty = target.shape[0];
    const tx = target.shape[1];
    const sy = source.shape[0];
    const sx = source.shape[1];

    if (ty !== sy || tx !== sx) {
      console.warn(
        'Cannot assign source to target ndarray as the dimensions do not match',
        ty,
        sy,
        tx,
        sx,
      );
      return;
    }

    if (target.dimension === 1) {
      for (let i = 0; i < target.shape[0]; ++i) {
        target.set(i, source.get(i));
      }
    } else {
      for (let i = 0; i < target.shape[0]; ++i) {
        for (let j = 0; j < target.shape[1]; ++j) {
          target.set(i, j, source.get(i, j));
        }
      }
    }
  }
};

export default ndarrayAssign;
