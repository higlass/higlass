import absToChr from './abs-to-chr';

export function pixelToGenomeLoci(x0, x1, y0, y1, chromInfo) {
  const gX0 = absToChr(x0, chromInfo);
  const gX1 = absToChr(x1, chromInfo);

  const gY0 = absToChr(y0, chromInfo);
  const gY1 = absToChr(y1, chromInfo);

  return [
    gX0[0], Math.round(gX0[1]),
    gX1[0], Math.round(gX1[1]),
    gY0[0], Math.round(gY0[1]),
    gY1[0], Math.round(gY1[1])
  ];
}
