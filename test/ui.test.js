import { page, userEvent } from '@vitest/browser/context';
import { describe, expect, vi } from 'vitest';

import { createHiGlassTestApi } from './utils/create-element-and-api';
import viewconf from './view-configs/simple-heatmap.json';

const it = createHiGlassTestApi(viewconf);

describe('Add Track', async () => {
  it('adds center track with upper right extent', async ({ api }) => {
    const hgc = api.getComponent();
    const spy = vi.spyOn(hgc, 'handleTrackAdded');

    /** @type {unknown} */
    let expected = undefined;
    /** @type {string | undefined} */
    spy.mockImplementationOnce((viewId, track, location, extent, host) => {
      // we could use expect(spy).toBeCalledWith(...) but don't want to assert the track
      expected = { viewId, location, extent, host };
    });

    // TODO: This should ideally be an aria-label or button/role.
    // data-testid is a last resort https://vitest.dev/guide/browser/locators#getbytestid
    await userEvent.click(page.getByTestId('add-track'));
    await userEvent.click(page.getByTestId('add-track-upper-right'));
    await userEvent.click(
      page.getByText(
        'Jin et al. (2013) IMR90_Flavopiridol HindIII (allreps) 1kb',
      ),
    );
    await userEvent.click(page.getByText('Submit'));
    expect(expected).toStrictEqual({
      viewId: 'a',
      location: 'center',
      extent: 'upper-right',
      host: undefined,
    });
  });
});
