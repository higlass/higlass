// @ts-nocheck
const getTrackObjById = (tiledPlots, viewId, trackId) => {
  const tiledPlot = viewId ? tiledPlots[viewId] : Object.values(tiledPlots)[0];

  if (!tiledPlot) {
    if (!viewId) console.warn('No views available.');
    else console.warn(`Could't find view with id "${viewId}"`);
    return undefined;
  }

  let track = tiledPlot.trackRenderer.trackDefObjects[trackId];

  if (!track) {
    Object.values(tiledPlot.trackRenderer.trackDefObjects)
      .map((trackDef) => trackDef.trackObject)
      .filter((trackObj) => trackObj.childTracks)
      .forEach((combinedTrack) => {
        if (combinedTrack.createdTracks[trackId]) {
          track = combinedTrack.createdTracks[trackId];
        }
      });
  } else {
    track = track.trackObject;
  }

  return track;
};

export default getTrackObjById;
