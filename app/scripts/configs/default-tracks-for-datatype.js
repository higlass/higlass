export const DEFAULT_TRACKS_FOR_DATATYPE = {
  arcs: {
    top: '1d-arcs',
    bottom: '1d-arcs',
  },
  chromsizes: {
    center: '2d-chromosome-grid',
    top: 'chromosome-labels',
    left: 'chromosome-labels',
    bottom: 'chromosome-labels',
    right: 'chromosome-labels',
  },
  matrix: {
    center: 'heatmap',
    top: 'linear-heatmap',
    left: 'linear-heatmap',
    right: 'linear-heatmap',
    bottom: 'linear-heatmap',
  },
  vector: {
    top: 'bar',
    bottom: 'bar',
    left: 'bar',
    right: 'bar',
  },
  epilogos: {
    top: 'horizontal-stacked-bar',
    bottom: 'horizontal-stacked-bar',
  },
  'geo-json': {
    center: 'geo-json',
  },
  'gene-annotation': {
    top: 'gene-annotations',
    bottom: 'gene-annotations',
    left: 'gene-annotations',
    right: 'gene-annotations',
  },
  bedlike: {
    top: 'bedlike',
    bottom: 'bedlike',
    left: 'vertical-bedlike',
    right: 'vertical-bedlike',
  },
  'osm-tiles': {
    center: 'osm-tiles',
  },
};

export default DEFAULT_TRACKS_FOR_DATATYPE;
