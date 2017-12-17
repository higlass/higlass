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
``config``. If ``config`` is a string, it is interpreted as a url and used to
try to fetch a remote viewconfig.

The ``options`` parameter can currently only specify the ``bounded`` property
which tells the HiGlass component to fill all the space in the containing
element. Note that if ``bounded`` is set to true, then ``element`` must have a
fixed height. ``callback`` is used to return an api variable which can be used
to access HiGlass events.

A full example of an inline HiGlass component can be found in the `HiGlass
GitHub repository
<https://github.com/hms-dbmi/higlass/blob/develop/app/test.html>`_.

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

Setting a view config
---------------------

The HiGlass API can be used to set a new viewconfig. This returns a Promise
which is fulfilled when all of the data for the view is loaded.

.. code-block:: javascript

    const p = hgApi.setViewConfig(newViewConfig);
    p.then(() => {
        // the initial set of tiles has been loaded
    });

Zooming to show all of the data
-------------------------------

One may set a view config pointing to a dataset which is either out of the
bounds of the view, too small, or too zoomed in. To fit the data inside of 
the view, the HiGlass API exposes the  ``zoomToDataExtent`` function.

.. code-block:: javascript

    api.zoomToDataExtent('viewUid');

The passed in ``viewUid`` should refer to a view which is present. If it
doesn't, an exception will be thrown.

Obtaining ordered chromosome info
---------------------------------

HiGlass provides an API for obtaining information about chromosomes
and the order they are listed in a chromSizes file:

.. code-block:: javascript

    import {ChromosomeInfo} from 'higlass';

    ChromosomeInfo(
      'http://higlass.io/api/v1/chrom-sizes/?id=Ajn_ttUUQbqgtOD4nOt-IA',
      (chromInfo) => {
        console.log('chromInfo:', chromInfo);
      });

This will return a data structure with information about the chromosomes
listed:

.. code-block:: json

    {
        chrPositions: {
            chr1 : {id: 0, chr: "chr1", pos: 0},
            chr2 : {id: 1, chr: "chr2", pos: 249250621} ,
            ...
        },
        chromLengths: {
            chr1: "249250621",
            chr2: "243199373",
            ...
        },
        cumPositions: [
            {id: 0, chr: "chr1", pos: 0},
            {id: 1, chr: "chr2", pos: 249250621},
            ...
         ]
    }

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
