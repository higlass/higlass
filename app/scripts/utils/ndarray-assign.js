import cwise from 'cwise';

const ndarrayAssign = (target, source) => {
  const numSource = +source;
  const isScalar = !Number.isNaN(numSource);

  if (isScalar) {
    cwise({
      args: ['array', 'scalar'],
      body: 'function assigns(a, s) { a = s; }'
    })(target, numSource);
  } else {
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

    cwise({
      args: ['array', 'array'],
      body: 'function assign(a, b) { a = b; }'
    })(target, source);
  }
};

export default ndarrayAssign;
