export const getTrackObjectFromHGC = (hgc, viewUid, trackUid) => hgc
  .tiledPlots[viewUid].trackRenderer.getTrackObject(trackUid);

export const getTrackRenderer = (hgc, viewUid) => hgc
  .tiledPlots[viewUid].trackRenderer;

export const getTiledPlot = (hgc, viewUid) => hgc
  .tiledPlots[viewUid];
