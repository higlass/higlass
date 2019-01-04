export const getTrackObjectFromHGC = (hgc, viewUid, trackUid) => {
  let newViewUid = viewUid;
  let newTrackUid = trackUid;

  if (!trackUid) {
    // didn't specify a trackUid so use the viewUid as the trackUid
    // and use the first plot
    newTrackUid = viewUid;
    newViewUid = Object.values(hgc.state.views)[0].uid;
  }
  console.log('hgc:', hgc.tiledPlots[newViewUid].trackRenderer, viewUid, trackUid);

  return hgc.tiledPlots[newViewUid].trackRenderer.getTrackObject(newTrackUid);
};

export const getTrackRenderer = (hgc, viewUid) => hgc
  .tiledPlots[viewUid].trackRenderer;

export const getTiledPlot = (hgc, viewUid) => hgc
  .tiledPlots[viewUid];
