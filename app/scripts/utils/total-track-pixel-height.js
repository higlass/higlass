// @ts-check
/**
 * @typedef Tracks
 * @prop {{ height: number }[]=} top
 * @prop {{ height: number }[]=} center
 * @prop {{ height: number }[]=} bottom
 */

/**
 * Calculate the total height of the horizontal and center tracks in pixels
 *
 * @param {{ tracks?: Tracks }} view - A typical view configuration containing a list of tracks
 * @returns {number} - The total height of the top, center and bottom tracks
 */
const totalTrackPixelHeight = (view) => {
  // no tracks means no height
  if (!view.tracks) return 0;

  let totalHeight = 0;

  if (view.tracks.top) {
    totalHeight += view.tracks.top
      .map((x) => x.height)
      .reduce((a, b) => a + b, 0);
  }

  if (view.tracks.center) {
    totalHeight += view.tracks.center
      .map((x) => x.height)
      .reduce((a, b) => a + b, 0);
  }

  if (view.tracks.bottom) {
    totalHeight += view.tracks.bottom
      .map((x) => x.height)
      .reduce((a, b) => a + b, 0);
  }

  return totalHeight;
};

export default totalTrackPixelHeight;
