const chrToAbs = (chrom, relPosition, chromInfo) =>
  chromInfo.chrPositions[chrom].pos + relPosition;

export default chrToAbs;
