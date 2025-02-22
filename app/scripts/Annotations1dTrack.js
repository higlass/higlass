import polygonArea from 'area-polygon';
import classifyPoint from 'robust-point-in-polygon';

import BedLikeTrack, { polyToPoly } from './BedLikeTrack';

/** Find out which rects are under a point.
 *
 * @param  {track} The track object
 * @param  {x} x position to check (relative to track)
 * @param  {y} y position to check (relative to track)
 * @return {[]} An array of drawnRects that are under that point
 */
export const rectsAtPoint = (track, x, y) => {
  const drawnRects = Object.values(track.drawnRects);
  const point = [x, y];
  const payloads = [];
  const g = track.rectGraphics;

  for (const drawnRect of drawnRects) {
    // copy the rect because polyToPoly is destructive
    const rect = drawnRect[0].slice(0);

    const poly = polyToPoly(
      rect,
      g.scale.x,
      g.position.x,
      g.scale.y,
      g.position.y,
    );
    const area = polygonArea(poly);

    if (classifyPoint(poly, point) === -1) {
      const payload = drawnRect[1];
      payload.area = area;

      payloads.push(payload);
    }
  }

  return payloads;
};

class Annotations1dTrack extends BedLikeTrack {
  constructor(context, options, isVertical) {
    super(context, options);
  }

  rerender(options, force) {
    if (options && options.projectUid !== this.options.projectUid) {
      // we're filtering by a new project id so we have to
      // re-fetch the tiles
      this.options = options;
      this.fetchedTiles = {};
      this.refreshTiles();
      return;
    }

    super.rerender(options, force);
  }

  /*
   * The local tile identifier
   */
  tileToLocalId(tile) {
    // tile contains [zoomLevel, xPos, yPos]
    return this.tileToRemoteId(tile);
  }

  /**
   * The tile identifier used on the server
   */
  tileToRemoteId(tile) {
    // tile contains [zoomLevel, xPos, yPos]
    let tileId = `${tile.join('.')}`;

    if (this.options.projectUid) {
      // include the projectUid in the options
      // (resgen feature)
      tileId = `${tileId}.ui=${this.options.projectUid}`;
    }

    return tileId;
  }

  /**
   * @param  {x} x position of the evt relative to the track
   * @param  {y} y position of the evt relative to the track
   */
  click(x, y) {
    const rects = rectsAtPoint(this, x, y);

    if (!rects.length) {
      this.selectRect(null);
    } else {
      this.selectRect(rects[0].value.uid);
    }

    return {
      type: '1d-annotations',
      event: null,
      payload: rects,
    };
  }

  render() {
    super.render();
  }
}

export default Annotations1dTrack;
