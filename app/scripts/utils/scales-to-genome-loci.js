import dataToGenomicLoci from './data-to-genomic-loci';

export const scalesToGenomeLoci = (xScale, yScale, chromInfo) => {
  if (chromInfo === null || !xScale || !yScale) return undefined;

  const x0 = xScale.domain()[0];
  const x1 = xScale.domain()[1];
  const y0 = yScale.domain()[0];
  const y1 = yScale.domain()[1];

  return [
    ...dataToGenomicLoci(x0, x1, chromInfo),
    ...dataToGenomicLoci(y0, y1, chromInfo),
  ];
};

export default scalesToGenomeLoci;
