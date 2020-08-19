const relToAbsChromPos = (chrom, x, y, chromInfo) => [
  chromInfo.chrPositions[chrom].pos + +x,
  chromInfo.chrPositions[chrom].pos + +y,
];

export default relToAbsChromPos;
