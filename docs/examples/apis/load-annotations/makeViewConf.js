function makeViewConf(viewconf, regions1d, regions2d) {
  const annotation1DOptions = {
    regions: regions1d,
    minRectWidth: 3,
    fillOpacity: 0.1,
    stroke: 'blue',
    strokePos: ['left', 'right'],
    strokeWidth: 2,
    strokeOpacity: 0.6,
  };
  const annotations1DHorizontal = {
    type: 'horizontal-1d-annotations',
    options: annotation1DOptions
  };
  const annotations1DVertical = {
    type: 'vertical-1d-annotations',
    options: annotation1DOptions
  };
  const annotations2D = {
    type: '2d-chromosome-annotations', // or 2d-annotations?
    chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
    options: {
      minRectWidth: 6,
      minRectHeight: 6,
      regions: regions2d.map(row => row.concat([
        'rgba(0, 0, 128, 0.66)', '',
        8, 8
      ]))
    }
  };
  viewconf.views[0].tracks.top.push(annotations1DHorizontal);
  viewconf.views[0].tracks.left.push(annotations1DVertical);
  viewconf.views[0].tracks.center[0].contents.push(annotations2D);
  return viewconf;
}
