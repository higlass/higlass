import { absToChr } from '.';

const dataToGenomicLoci = (x0, x1, chromInfo) => {
  const gX0 = absToChr(x0, chromInfo);
  const gX1 = absToChr(x1, chromInfo);

  return [gX0[0], Math.round(gX0[1]), gX1[0], Math.round(gX1[1])];
};

export default dataToGenomicLoci;
