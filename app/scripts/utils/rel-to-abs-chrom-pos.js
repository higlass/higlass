const relToAbsChromPos = (chrom, x, y, chromInfo) => {
  return [
    chromInfo.chrPositions[chrom].pos + x,
    chromInfo.chrPositions[chrom].pos + y
  ]
}

export default relToAbsChromPos;
