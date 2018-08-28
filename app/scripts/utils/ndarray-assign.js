const ndarrayAssign = (target, source) => {
  const ty = target.shape[0];
  const tx = target.shape[1];
  const sy = source.shape[0];
  const sx = source.shape[1];

  if (ty !== sy || tx !== sx) {
    console.warn(
      'Cannot assign source to target ndarray as the dimensions do not match',
      ty, sy, tx, sx
    );
    return;
  }

  for (let i = 0; i < ty; ++i) {
    for (let j = 0; j < tx; ++j) {
      target.set(i, j, source.get(i, j));
    }
  }
};

export default ndarrayAssign;
