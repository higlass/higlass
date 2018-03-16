export const DEFAULT_TRACKS_FOR_DATATYPE = {
  'matrix': {
    'center': 'heatmap',
    'top': 'horizontal-heatmap',
    'left': 'vertical-heatmap',
    'right': 'vertical-heatmap',
    'bottom': 'horizontal-heatmap',
  },
  'vector': {
    'top': 'horizontal-bar',
    'bottom': 'horizontal-bar',
    'left': 'vertical-bar',
    'right': 'vertical-bar',
  },
  'multivec': {
    'top': 'horizontal-multivec',
    'bottom': 'horizontal-multivec',
  },
  'geo-json': {
    'center': 'geo-json',
  },
  'gene-annotations': {
    'top': 'horizontal-gene-annotations',
    'bottom': 'horizontal-gene-annotations',
    'left': 'vertical-gene-annotations',
    'right': 'horizontal-gene-annotations',
  },
  'chromsizes': {
    'top': 'horizontal-chromosome-labels',
    'bottom': 'horizontal-chromosome-labels',
    'center': '2d-chromosome-grid',
    'left': 'vertical-chromosome-labels',
    'right': 'vertical-chromosome-labels',
  },
  'bedlike': {
    'top': 'bedlike',
    'bottom': 'bedlike',
    'left': 'vertical-bedlike',
    'right': 'vertical-bedlike',
  },
};

export default DEFAULT_TRACKS_FOR_DATATYPE;
