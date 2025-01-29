// @ts-nocheck
import { page } from '@vitest/browser/context';
import { describe, expect, it, vi } from 'vitest';

// Utils
import { getTrackRenderer } from '../app/scripts/utils';

import createElementAndApi from './utils/create-element-and-api';
import viewConfig from './view-configs/two-bars-and-a-heatmap.json';

describe('Context menu tests', () => {
  it('opens a context menu', async () => {
    const [_, api] = createElementAndApi(viewConfig);
    const contextmenu = new MouseEvent('contextmenu', {
      clientX: 348,
      clientY: 315,
      bubbles: true,
      view: window,
    });

    const trackRenderer = getTrackRenderer(api.getComponent(), 'aa');
    const trackObj = trackRenderer.getTrackObject('cc');
    const spy = vi.spyOn(trackObj, 'contextMenuItems');
    trackRenderer.eventTracker.dispatchEvent(contextmenu);

    const node = page.getByText('Dekker Lab HFFc6 DpnII');
    await expect.element(node).toBeInTheDocument();
    await node.hover();
    await expect
      .element(page.getByText('Configure Series'))
      .toBeInTheDocument();
    expect(spy).toHaveBeenCalled();
  });
});
