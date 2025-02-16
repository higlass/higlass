// @ts-nocheck
import * as vi from 'vitest';
import { page } from '@vitest/browser/context';

// Utils
import { getTrackRenderer } from '../app/scripts/utils';

import createElementAndApi from './utils/create-element-and-api';
import viewConfig from './view-configs/two-bars-and-a-heatmap.json';

vi.describe('Context menu tests', () => {
  vi.it('opens a context menu', async () => {
    const [_, api] = createElementAndApi(viewConfig);
    const contextmenu = new MouseEvent('contextmenu', {
      clientX: 348,
      clientY: 315,
      bubbles: true,
      view: window,
    });

    const trackRenderer = getTrackRenderer(api.getComponent(), 'aa');
    const trackObj = trackRenderer.getTrackObject('cc');
    const spy = vi.vi.spyOn(trackObj, 'contextMenuItems');
    trackRenderer.eventTracker.dispatchEvent(contextmenu);

    const node = page.getByText('Dekker Lab HFFc6 DpnII');
    await vi.expect.element(node).toBeInTheDocument();
    await node.hover();
    await vi.expect
      .element(page.getByText('Configure Series'))
      .toBeInTheDocument();
    vi.expect(spy).toHaveBeenCalled();
  });
});
