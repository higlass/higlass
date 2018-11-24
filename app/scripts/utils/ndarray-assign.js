import cwise from 'cwise';

const ndarrayAssign = (target, source) => {
  const numSource = +source;
  const isScalar = !Number.isNaN(numSource);

  if (isScalar) {
    cwise({
      args: ['array', 'scalar'],
      body: (a, s) => {
        a = s;  // eslint-disable-line
      }
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
      body: (a, b) => {
        a = b;  // eslint-disable-line
      }
    })(target, source);
  }
};

export default ndarrayAssign;
