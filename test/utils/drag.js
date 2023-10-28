// @ts-nocheck
import { getTrackRenderer } from '../../app/scripts/utils';

const drag = (fromX, fromY, toX, toY, viewId, hgc) => {
  // simulate a zoom drag event by doing a
  // mousedown, mousemove and mouseup
  const evtDown = new MouseEvent('mousedown', {
    clientX: fromX,
    clientY: fromY,
    view: window,
  });

  const evtMove = new MouseEvent('mousemove', {
    clientX: toX,
    clientY: toY,
    view: window,
  });

  const evtUp = new MouseEvent('mouseup', {
    clientX: toX,
    clientY: toY,
    view: window,
  });

  const trackRenderer = getTrackRenderer(hgc, viewId);

  const prevTransform = trackRenderer.zoomTransform;

  trackRenderer.element.dispatchEvent(evtDown);
  trackRenderer.element.dispatchEvent(evtMove);
  trackRenderer.element.dispatchEvent(evtUp);

  const newTransform = trackRenderer.zoomTransform;

  const dx = newTransform.x - prevTransform.x;
  const dy = newTransform.y - prevTransform.y;

  return [dx, dy, trackRenderer];
};

export default drag;
