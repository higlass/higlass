import { page } from '@vitest/browser/context';
import { afterEach, describe, expect, it } from 'vitest';

import * as hglib from '../app/scripts/hglib';

import { waitForTilesLoaded } from '../app/scripts/test-helpers/test-helpers';

describe('viewer', () => {
  it('viewer accepts and loads a remote URL', async () => {
    const div = document.createElement('div');
    Object.assign(div.style, {
      width: '800px',
      height: '400px',
      backgroundColor: 'lightgreen',
    });
    document.body.append(div);
    const promise = hglib.viewer(
      div,
      'http://higlass.io/api/v1/viewconfs/?d=default',
      { bounded: true },
    );
    expect(promise).toBeInstanceOf(Promise);
    const api = await promise;
    // Assert the top-level API
    expect(api).toMatchInlineSnapshot(`
      {
        "activateTool": [Function],
        "destroy": [Function],
        "exportAsPngBlobPromise": [Function],
        "exportAsSvg": [Function],
        "exportAsViewConfString": [Function],
        "getAuthHeader": [Function],
        "getComponent": [Function],
        "getLocation": [Function],
        "getMinMaxValue": [Function],
        "getRangeSelection": [Function],
        "getTrackObject": [Function],
        "getViewConfig": [Function],
        "hideAvailableTrackPositions": [Function],
        "hideTrackChooser": [Function],
        "measureSize": [Function],
        "off": [Function],
        "on": [Function],
        "option": [Function],
        "reload": [Function],
        "resetViewport": [Function],
        "setAuthHeader": [Function],
        "setBroadcastMousePositionGlobally": [Function],
        "setDarkTheme": [Function],
        "setGlobalMousePosition": [Function],
        "setRangeSelection1dSize": [Function],
        "setRangeSelectionToFloat": [Function],
        "setRangeSelectionToInt": [Function],
        "setShowGlobalMousePosition": [Function],
        "setSizeMode": [Function],
        "setTheme": [Function],
        "setTrackValueScaleLimits": [Function],
        "setViewConfig": [Function],
        "shareViewConfigAsLink": [Function],
        "showAvailableTrackPositions": [Function],
        "showTrackChooser": [Function],
        "suggestGene": [Function],
        "validateViewConfig": [Function],
        "version": "2.1.5",
        "zoomTo": [Function],
        "zoomToDataExtent": [Function],
        "zoomToGene": [Function],
      }
    `);
    expect(Object.keys(api.getViewConfig())).toMatchInlineSnapshot(`
      [
        "editable",
        "zoomFixed",
        "trackSourceServers",
        "exportViewUrl",
        "views",
        "zoomLocks",
        "locationLocks",
        "valueScaleLocks",
      ]
    `);

    // Wait for the Genome search box to be in the DOM
    await expect.element(page.getByRole('combobox')).toBeInTheDocument();

    const hgc = api.getComponent();

    // Wait for tiles to load
    await new Promise((done) => waitForTilesLoaded(hgc, done));

    // TODO: more assertons?
    expect(hgc.state.viewConfig.editable).toBe(true);
  });

  afterEach(() => {
    document.body.replaceChildren();
  });
});
