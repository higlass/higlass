/** @import * as t from '../types' */

/**
 * @param {t.TrackConfig} trackConfig
 * @return {trackConfig is t.CombinedTrackConfig}
 */
export function isCombinedTrackConfig(trackConfig) {
  return 'contents' in trackConfig && trackConfig.type === 'combined';
}

/**
 * @param {Event} event
 * @returns {event is WheelEvent}
 */
export function isWheelEvent(event) {
  return 'deltaY' in event && 'deltaMode' in event;
}

/**
 * @param {unknown} obj
 * @returns {obj is {}}
 */
export function isObject(obj) {
  return obj !== null && typeof obj === 'object';
}

/**
 * @param {t.TilesetInfo | undefined} info
 * @returns {info is t.LegacyTilesetInfo}
 */
export function isLegacyTilesetInfo(info) {
  return isObject(info) && 'max_width' in info;
}

/**
 * @param {t.TilesetInfo | undefined | { error: string }} info
 * @returns {info is t.ResolutionsTilesetInfo}
 */
export function isResolutionsTilesetInfo(info) {
  return isObject(info) && 'resolutions' in info;
}
/**
 * @param {t.TilesetInfo | undefined | { error: string }} info
 * @returns {info is t.TilesetInfo}
 */
export function isTilesetInfo(info) {
  return isObject(info) && !('error' in info);
}
