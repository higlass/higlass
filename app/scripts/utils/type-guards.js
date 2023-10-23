// @ts-check

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
