// @ts-nocheck
/**
 * Get a track's config (not the track object) from a higlass component.
 *
 * @param  {HiGlassComponent} hgc      HiGlassComponent object
 * @param  {string} viewUid  The uid of the view
 * @param  {string} trackUid The uid of the track
 * @return {object}          Track conf if found else null
 */
const getTrackConfFromHGC = (hgc, viewUid, trackUid) => {
  const views = hgc.state.views;
  const myView = views[viewUid];
  if (!myView) return null;

  let found = null;

  const checkTrack = (track) => {
    if (track.uid === trackUid) found = track;
    if (track.type.substr(0, 8) === 'combined')
      track.contents.forEach(checkTrack);
    return null;
  };

  const tracks = myView.tracks;

  Object.keys(tracks)
    .map((trackType) => tracks[trackType])
    .filter((tracksByPos) => tracksByPos.filter)
    .reduce((a, b) => a.concat(b), [])
    .forEach(checkTrack);

  return found;
};

export default getTrackConfFromHGC;
