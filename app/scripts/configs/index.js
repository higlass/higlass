/* ------------------------------- Primitives ------------------------------- */

export * from './primitives';

/* --------------------------------- Themes -------------------------------- */

export { THEME_LIGHT, THEME_DARK, THEME_DEFAULT } from './themes';

/* --------------------------------- Complex -------------------------------- */

export { default as GLOBALS } from './globals';
export { default as DATATYPE_TO_TRACK_TYPE } from './datatype-to-track-type';
export { HEATED_OBJECT_MAP } from './colormaps';
export { default as TRACKS_INFO } from './tracks-info';
export { default as TRACKS_INFO_BY_TYPE } from './tracks-info-by-type';
export { default as POSITIONS_BY_DATATYPE } from './positions-by-datatype';
export { default as DEFAULT_TRACKS_FOR_DATATYPE } from './default-tracks-for-datatype';
export { default as AVAILABLE_TRACK_TYPES } from './available-track-types';
export {
  NUM_PRECOMP_SUBSETS_PER_1D_TTILE,
  NUM_PRECOMP_SUBSETS_PER_2D_TTILE,
} from './dense-data-extrema-config';

export const SIZE_MODE_DEFAULT = 'default';
export const SIZE_MODE_BOUNDED = 'bounded';
export const SIZE_MODE_OVERFLOW = 'overflow';
export const SIZE_MODE_BOUNDED_OVERFLOW = 'bounded-overflow';
export const SIZE_MODE_SCROLL = 'scroll';
