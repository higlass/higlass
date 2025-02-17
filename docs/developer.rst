Developer
*********

Cheat Codes
===========

Cheat codes are meant to expose functionality that shouldn't otherwise be
available. They can be activated by passing `cheatCodesEnabled` as an option to
the HiGlassComponent and then typing a string when a higlass window is visible.

- "hgedit": Toggle the header and make the higlass component editable.

Testing
=======

To run the tests use:

.. code-block:: bash

    npx vitest # headless mode
    npx vitest --browser.headless=false # open tests in browser

Many view configs (and thus tests) rely on external API requests to a HiGlass
server (`resgen.io`, `higlass.io`). These requests are slow and can be flaky,
so we use mock service worker (msw) to mock them at the browser network level.

Handlers are defined in `vitest.setup.js`, intercepting requests before they
reach the server.

To enable mocking, set the environment variable:

.. code-block:: bash

    VITE_USE_MOCKS=1 npx vitest

A cache of mock fixtures is stored under `test/mocks/`. Since we do not
currently persist these fixtures, the first run with `VITE_USE_MOCKS=1` will
make real requests and save responses to disk. Subsequent runs will use the
cached data.

JSON Schema
-----------
There are unit tests that validate all the viewconfs that have been
checked in as fixtures. If you want to validate just one viewconf by hand:

.. code-block:: bash

  npm install -g ajv-cli
  ajv validate -s app/schema.json -d docs/examples/viewconfs/default.json

Boilerplate
-----------

Use the following template and replace individual ``it`` blocks
to set up new tests. Add this code to the `test` directory.

.. code-block:: javascript

    import { describe, beforeAll, afterAll, it, expect } from 'vitest';

    import Enzyme from 'enzyme';
    import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

    // Utils
    import {
      mountHGComponentAsync,
      removeHGComponent,
    } from '../app/scripts/test-helpers';
    import { getTrackObjectFromHGC } from '../app/scripts/utils';

    configure({ adapter: new Adapter() });

    describe('Horizontal heatmaps', () => {
      let hgc = null;
      let div = null;

      beforeAll(async () => {
        [div, hgc] = await mountHGComponentAsync(div, hgc, viewconf, {
          style: 'width:800px; height:400px; background-color: lightgreen',
          bounded: true,
        }) 
      });

      afterAll(() => {
        removeHGComponent(div);
      });

      it('should respect zoom limits', () => {
        // add your tests here

        const trackObj = getTrackObjectFromHGC(hgc.instance(), 'vv', 'tt');
        expect(trackObj.calculateZoomLevel()).to.eql(1);
      });

    });

    // enter either a viewconf link or a viewconf object
    const viewconf = {
      "editable": true,
      "zoomFixed": false,
      "trackSourceServers": [
        "/api/v1",
        "http://higlass.io/api/v1"
      ],
      "exportViewUrl": "/api/v1/viewconfs/",
      "views": [
        {
          "tracks": {}
          "uid": "vv"
        }
      ],
    }

Convenience Functions
---------------------

To get the track object associated with a view and track uid:

.. code-block:: javascript

    import {
        getTrackObjectFromHGC
    } from '../app/scripts/utils';

    const trackObj = getTrackObjectFromHGC(hgc.instance(),
        'view_uid', 'track_uid')

Contributor Guidelines
=======================

Contributions are in the form of issues, code, documentation are always very welcome. The
following are a set of guidelines to help ensure that contributions can be smoothly
merged into the existing code base:

1. All code contributions should be accompanied by a test. Tests can be placed into the `test`
   folder.
2. All added functions should include a jsdoc string for javascript code or a numpy style
   docstring for python code.
