export const DEFAULT_TRACKS_FOR_DATATYPE = {
  chromsizes: {
    center: '2d-chromosome-grid',
    top: 'horizontal-chromosome-labels',
    left: 'vertical-chromosome-labels',
    bottom: 'horizontal-chromosome-labels',
    right: 'vertical-chromosome-labels',
  },
  matrix: {
    center: 'heatmap',
    top: 'horizontal-heatmap',
    left: 'vertical-heatmap',
    right: 'vertical-heatmap',
    bottom: 'horizontal-heatmap',
  },
  vector: {
    top: 'horizontal-bar',
    bottom: 'horizontal-bar',
    left: 'vertical-bar',
    right: 'vertical-bar',
  },
  'geo-json': {
    center: 'geo-json',
  },
  'gene-annotation': {
    top: 'horizontal-gene-annotations',
    bottom: 'horizontal-gene-annotations',
    left: 'vertical-gene-annotations',
    right: 'horizontal-gene-annotations',
  },
  bedlike: {
    top: 'bedlike',
    bottom: 'bedlike',
    left: 'vertical-bedlike',
    right: 'vertical-bedlike',
  },
};

export default DEFAULT_TRACKS_FOR_DATATYPE;
