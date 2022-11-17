.. _troubleshooting:

===========
Troubleshooting
===========

Empty Page
==========

HiGlass showing as an empty page in Firefox on Linux
----------------------------------------------------

Due to a bug in Mesa video drivers that has since been fixed, Firefox introduced a workaround which prevents HiGlass to load.
To disable this workaround, set ``gfx.work-around-driver-bugs=false`` in ``about:config``, and restart the browser.

Source: https://bugzilla.mozilla.org/show_bug.cgi?id=1601682

How to Upgrade to React 18
==========================

If you were using previous HiGlass versions that use React 16 or 17 and want to upgrade HiGlass to the latest version, 
you need to make the following changes.

Use the latest version of React in your application:

.. code-block:: bash
    
    npm install react react-dom

.. code-block:: html

    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

The ``hglib.viewer()`` function now returns a promise instead of an object. So, to be able to use API, change from

.. code-block:: html

    const hgApi = hglib.viewer(
        document.getElementById('demo'),
        viewConfig,
        { bounded: true },
    );

    hgApi.on('viewConfig', () => {
        console.log('View Config changed');
    });

to

.. code-block:: html

    hglib.viewer(
        document.getElementById('demo'),
        viewConfig,
        { bounded: true },
    ).then((hgApi) => {
        hgApi.on('viewConfig', () => {
            console.log('View Config changed');
        });
    });

or

.. code-block:: html

    const hgApi = await hglib.viewer(
        document.getElementById('demo'),
        viewConfig,
        { bounded: true },
    );

    hgApi.on('viewConfig', () => {
        console.log('View Config changed');
    });

depending on your code styles.

For more general guidelines for upgrading React, please visit https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html.
