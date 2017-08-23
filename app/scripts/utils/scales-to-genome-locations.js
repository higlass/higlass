import absoluteToChr from './absolute-to-chr';

const scalesToGenomeLocations = (xScale, yScale, chromInfo) => {
  if (chromInfo === null) { return; }

  if (!xScale || !yScale) { return; }

  let x1 = absoluteToChr(xScale.domain()[0], chromInfo);
  let x2 = absoluteToChr(xScale.domain()[1], chromInfo);

  let y1 = absoluteToChr(yScale.domain()[0], chromInfo);
  let y2 = absoluteToChr(yScale.domain()[1], chromInfo);

  return [
    x1[0], Math.round(x1[1]),
    x2[0], Math.round(x2[1]),
    y1[0], Math.round(y1[1]),
    y2[0], Math.round(y2[1])
  ];
}

export default scalesToGenomeLocations;
