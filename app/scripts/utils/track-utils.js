// @ts-nocheck
const COLLAPSED_HEIGHT = 10;

export const trackHeight = (track) => {
  if (track.options?.collapsed) return COLLAPSED_HEIGHT;
  return track.height;
};

export const trackWidth = (track) => {
  if (track.options?.collapsed) return COLLAPSED_HEIGHT;
  return track.width;
};
