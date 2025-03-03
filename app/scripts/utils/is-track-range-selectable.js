import or from './or';

/**
 * Return true if this track is selectable by range.
 * @param {import('../types').TrackConfig} track
 * @returns {boolean}
 */
export const IS_TRACK_RANGE_SELECTABLE = (track) => {
  switch (track.type) {
    case 'heatmap':
    case 'horizontal-1d-heatmap':
    case 'horizontal-bar':
    case 'horizontal-line':
    case 'horizontal-point':
    case 'vertical-1d-heatmap':
    case 'vertical-bar':
    case 'vertical-line':
    case 'vertical-point':
    case 'horizontal-1d-tiles':
    case 'vertical-1d-tiles':
    case '2d-tiles':
    case 'horizontal-gene-annotations':
    case 'vertical-gene-annotations':
    case 'horizontal-heatmap':
    case 'vertical-heatmap':
    case 'osm-tiles':
    case 'mapbox-tiles':
    case 'horizontal-multivec':
      return true;

    case 'combined': {
      /** @type {import('../types').TrackConfig[]} */
      // @ts-expect-error - TS should be able to narrow the type but isn't smart enough
      const contents = track.contents;
      return contents
        .map((t) => IS_TRACK_RANGE_SELECTABLE(t))
        .reduce(or, false);
    }

    default:
      return false;
  }
};

export default IS_TRACK_RANGE_SELECTABLE;
