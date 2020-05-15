Developer
*********

Cheat Codes
===========

Cheat codes are meant to expose functionality that shouldn't otherwise be available. They can be activated by passing `cheatCodesEnabled` as an option to the HiGlassComponent and
then typing a string when a higlass window is visible.

- "hgedit": Toggle the header and make the higlass component editable.

Testing
=======

To run the tests use:

.. code-block:: bash

    npm run test-watch

To only run specific test suites, open ``karma.conf.js`` and
select which tests to run.

All http requests can be automatically mocked and their responses stored in ``test/mocked-responses``. This makes it possible to use a local higlass server when adding new tests. New tests that use data which has not been already stored, should be run a few times locally in order to mock all occuring http requests.

Please note: When adding new viewConfigs that make use of mocked responses, make sure that links do not start with ``//`` but with ``http(s)://``. The mocking library ``fetch-mock`` that we are using, does not support links without protocol. In order get started with mocked responses, follow the setup of ``FetchMockHelper`` as in ``DenseDataExtremaTests``.

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
to set up new tests. Add this code to the `tests` directory and
add a line to `karma.conf.js` to include it in the tests.

.. code-block:: javascript

    /* eslint-env node, jasmine */
    import {
      configure,
      // render,
    } from 'enzyme';

    import Adapter from 'enzyme-adapter-react-16';

    import { expect } from 'chai';

    // Utils
    import {
      mountHGComponent,
      removeHGComponent,
      getTrackObjectFromHGC
    } from '../app/scripts/utils';

    configure({ adapter: new Adapter() });

    describe('Horizontal heatmaps', () => {
      let hgc = null;
      let div = null;

      beforeAll((done) => {
        ([div, hgc] = mountHGComponent(div, hgc,
          viewconf,
          done,
          {
            style: 'width:800px; height:400px; background-color: lightgreen',
            bounded: true,
          })
        );
      });

      it('should respect zoom limits', () => {
        // add your tests here

        const trackObj = getTrackObjectFromHGC(hgc.instance(), 'vv', 'tt');
        expect(trackObj.calculateZoomLevel()).to.eql(1);
      });

      afterAll(() => {
        removeHGComponent(div);
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
