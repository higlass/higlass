/**
 * @param {import('../types').TrackConfig} trackConfig
 * @return {trackConfig is import('../types').CombinedTrackConfig}
 */
export function isCombinedTrackConfig(trackConfig) {
  return trackConfig.type === 'combined';
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
 * @param {import('../types').TilesetInfo | undefined} info
 * @returns {info is import('../types').LegacyTilesetInfo}
 */
export function isLegacyTilesetInfo(info) {
  return isObject(info) && 'max_width' in info;
}

/**
 * @param {import('../types').TilesetInfo | undefined | {error: string}} info
 * @returns {info is import('../types').ResolutionsTilesetInfo}
 */
export function isResolutionsTilesetInfo(info) {
  return isObject(info) && 'resolutions' in info;
}
/**
 * @param {import('../types').TilesetInfo | undefined | {error: string}} info
 * @returns {info is import('../types').TilesetInfo}
 */
export function isTileSetInfo(info) {
  return isObject(info) && !('error' in info);
}