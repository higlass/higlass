=======================
Developer Documentation
=======================

HiGlass API
===========

Creating an inline HiGlass component
------------------------------------

.. code-block:: javascript

    createHgComponent(element, config, options, callback)

Create a new HiGlass component within a web page. This initializes a
HiGlassComponent inside the element ``element`` with a viewconfig passed in as
``config``. If ``config`` is a string, it is interpreted as a url and used
to try to fetch a remote viewconfig.

The ``options`` parameter can currently only specify the
``bounded`` property which tells the HiGlass component to fill all the space in
the containing element. Note that if ``bounded`` is set to true, then
``element`` must have a fixed height. ``callback`` is used to return
an api variable which can be used to access HiGlass events.

A full example of an inline HiGlass component can be found in
the `HiGlass GitHub repository <https://github.com/hms-dbmi/higlass/blob/develop/app/test.html>`_.

**Example**

.. code-block:: javascript

    let hgApi = null;
    hglib.createHgComponent(
        document.getElementById('development-demo'),
        testViewConfig,
        { bounded: true },
        function (api) {
            hgApi = api;
        }
    );


Coding Guidelines
=================

To ensure uniformity within the code base, we suggest the following
guidelines for style and documentation within the HiGlass ecosystem.

Spacing
-------

Code should be indented with 2 spaces. No tabs!

Docstrings
----------

All functions should be annotated with a docstring in the `JSDoc style <http://usejsdoc.org/>`_.
