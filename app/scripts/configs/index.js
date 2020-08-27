/* ------------------------------- Primitives ------------------------------- */

export const DEFAULT_VIEW_MARGIN = 0;

export const DEFAULT_VIEW_PADDING = 5;

export const DEFAULT_CONTAINER_PADDING_X = 10;

export const DEFAULT_CONTAINER_PADDING_Y = 10;

export const MAX_CLICK_DELAY = 300;

export const MOUSE_TOOL_MOVE = 'move';

export const MOUSE_TOOL_SELECT = 'select';

export const TILE_FETCH_DEBOUNCE = 100;

// Number of milliseconds zoom-related actions (e.g., tile loading) are debounced
export const ZOOM_DEBOUNCE = 10;

// the length of time to keep refreshing the view after a drag event
export const SHORT_DRAG_TIMEOUT = 110;

export const LONG_DRAG_TIMEOUT = 3000;

export const LOCATION_LISTENER_PREFIX = 'locationListenerPrefix';

export const ZOOM_TRANSITION_DURATION = 1000;

export const DEFAULT_SERVER = 'http://higlass.io/api/v1';

export const VIEW_HEADER_MED_WIDTH_SEARCH_BAR = 400;

export const VIEW_HEADER_MIN_WIDTH_SEARCH_BAR = 300;

export const TRACK_LOCATIONS = [
  'top',
  'left',
  'right',
  'bottom',
  'center',
  'whole',
  'gallery',
];

export const MIN_HORIZONTAL_HEIGHT = 20;

export const MIN_VERTICAL_WIDTH = 20;

/* --------------------------------- Themes -------------------------------- */

export { THEME_LIGHT, THEME_DARK, THEME_DEFAULT } from './themes';

/* --------------------------------- Complex -------------------------------- */

export { default as GLOBALS } from './globals';
export { default as DATATYPE_TO_TRACK_TYPE } from './datatype-to-track-type';
export { default as HEATED_OBJECT_MAP } from './colormaps';
export { default as IS_TRACK_RANGE_SELECTABLE } from './is-track-range-selectable';
export { default as OPTIONS_INFO } from './options-info';
export { default as TRACKS_INFO } from './tracks-info';
export { default as TRACKS_INFO_BY_TYPE } from './tracks-info-by-type';
export { default as POSITIONS_BY_DATATYPE } from './positions-by-datatype';
export { default as DEFAULT_TRACKS_FOR_DATATYPE } from './default-tracks-for-datatype';
export { default as AVAILABLE_FOR_PLUGINS } from './available-for-plugins';
export { default as AVAILABLE_TRACK_TYPES } from './available-track-types';
