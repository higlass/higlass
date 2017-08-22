import pixelToGenomeLoci from './pixel-to-genome-loci';

export function scalesToGenomeLoci(xScale, yScale, chromInfo) {
  if (chromInfo === null || (!xScale || !yScale)) { return; }

  const x0 = xScale.domain()[0];
  const x1 = xScale.domain()[1];
  const y0 = yScale.domain()[0];
  const y1 = yScale.domain()[1];

  return pixelToGenomeLoci(x0, x1, y0, y1, chromInfo);
}
