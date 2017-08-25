import { or } from '../utils';

export const isTrackRangeSelectable = (track) => {
  switch (track.type) {
    case 'heatmap':
    case 'horizontal-line':
    case 'vertical-line':
    case 'horizontal-1d-tiles':
    case 'vertical-1d-tiles':
    case '2d-tiles':
    case 'horizontal-gene-annotations':
    case 'vertical-gene-annotations':
    case 'horizontal-heatmap':
    case 'vertical-heatmap':
    case 'osm-tiles':
    case 'mapbox-tiles':
      return true;

    case 'combined': {
      return track.contents
        .map(track => isTrackRangeSelectable(track))
        .reduce(or, false);
    }

    default:
      return false;
  }
}

export default isTrackRangeSelectable;
