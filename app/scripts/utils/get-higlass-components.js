/** @import * as t from '../types' */
/** @import HiGlassComponent from '../HiGlassComponent' */
/** @import { TrackRenderer } from '../TrackRenderer' */
/** @import { TiledPlot } from '../TiledPlot' */

/**
 * @param {HiGlassComponent} hgc
 * @param {string} viewUid
 * @param {string | undefined} trackUid
 * @returns {t.TrackObject | undefined}
 */
export const getTrackObjectFromHGC = (hgc, viewUid, trackUid) => {
  /** @type {string} */
  let newViewUid = viewUid;
  /** @type {string} */
  let newTrackUid;

  if (!trackUid) {
    // didn't specify a trackUid so use the viewUid as the trackUid
    // and use the first plot
    newTrackUid = viewUid;
    newViewUid = Object.values(hgc.state.views)[0].uid;
  } else {
    newTrackUid = trackUid;
  }

  return hgc.tiledPlots[newViewUid].trackRenderer?.getTrackObject(newTrackUid);
};

/**
 * @param {HiGlassComponent} hgc
 * @param {string} viewUid
 * @returns {TrackRenderer | null}
 */
export const getTrackRenderer = (hgc, viewUid) =>
  hgc.tiledPlots[viewUid].trackRenderer;

/**
 * @param {HiGlassComponent} hgc
 * @param {string} viewUid
 * @returns {TiledPlot}
 */
export const getTiledPlot = (hgc, viewUid) => hgc.tiledPlots[viewUid];
