Javascript API 
##############

Overview
========

Embedding HiGlass in web page
*****************************

HiGlass can be included in any web page by including the relevant
javascript and css files:

.. code-block:: javascript

    <link rel="stylesheet" href="https://unpkg.com/higlass@1.1.5/dist/styles/hglib.css" type="text/css">
    <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" type="text/css">


    <script src="https://cdnjs.cloudflare.com/ajax/libs/react/15.5.4/react.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react/15.5.4/react-dom.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/4.5.2/pixi.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react-bootstrap/0.31.0/react-bootstrap.min.js"></script>

    <script src="https://unpkg.com/higlass@1.1.5/dist/scripts/hglib.js"></script>

External tracks should be included **before** the hglib.js import:

.. code-block:: javascript

    <script src="https://unpkg.com/higlass-multivec@0.1.10/dist/higlass-multivec.js"></script>

Instructions for instantiating the component and interacting with it are in the 
`Public API section <higlass_developer.html#public-api>`_.

Available endpoints
-------------------

.. code-block:: javascript

  import { HiGlassComponent, ChromosomeInfo, viewer } from 'higlass';

HiGlass exports three endpoints for your convenience. ``viewer`` is the main
endpoint to create a new HiGlass component. ``HiGlassComponent`` can be used
to integrate HiGlass in your React application. ``ChromosomeInfo`` is a class
for converting absolute coordinates to chromosome coordinates. It's used
internally and made available to convert absolute range selection into
chromosome range selections.

Creating an inline HiGlass component
------------------------------------

.. code-block:: javascript

  const hgv = hglib.viewer(element, config, options);

Create a new HiGlass viewer within a web page. This initializes a
HiGlassComponent inside the element ``element`` with a viewconfig passed in as
``config``. If ``config`` is a string, it is interpreted as a url and used to
try to fetch a remote viewconfig.

The ``options`` parameter can currently only specify the ``bounded`` property
which tells the HiGlass component to fill all the space in the containing
element. Note that if ``bounded`` is set to true, then ``element`` must have a
fixed height. ``callback`` is used to return an api variable which can be used
to access HiGlass events.

The function returns an instance of the public API of a HiGlass component.

A full example of an inline HiGlass component can be found in the `HiGlass
GitHub repository
<https://github.com/hms-dbmi/higlass/blob/develop/app/api.html>`_.


**Example**

.. code-block:: javascript

  const hgv = hglib.viewer(
    document.getElementById('development-demo'),
    testViewConfig,
    { bounded: true },
  );

Creating a HiGlass component in your React app
----------------------------------------------

.. code-block:: javascript

  <HiGlassComponent
    options={options}
    viewConfig={viewConfig}
  >

Use the ``HiGlassComponent`` to create a HiGlass instance in react. The
``options`` prop is the same as explained above.

**Example**

.. code-block:: javascript

  import { HiGlassComponent } from 'higlass';

  const HiGlass = props => <HiGlassComponent
    ref={props.onRef}
    options={props.options}
    viewConfig={props.viewConfig}
  >

  export default HiGlass;

Obtaining ordered chromosome info
---------------------------------

HiGlass provides an API for obtaining information about chromosomes
and the order they are listed in a chromSizes file:

.. code-block:: javascript

  import { ChromosomeInfo } from 'higlass';

  const chromInfo = ChromosomeInfo(
    'http://higlass.io/api/v1/chrom-sizes/?id=Ajn_ttUUQbqgtOD4nOt-IA',
    (chromInfo) => { console.log('chromInfo:', chromInfo); });

This will return a data structure with information about the chromosomes
listed:

.. code-block:: javascript

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

**Convert absolute to chromosomal coordinates:**

.. code-block:: javascript

  absPos = 257893;
  chromPos = chromInfo.absToChr(absPos);

API Functions
=============

.. js:autofunction:: viewer

.. js:autofunction:: reload

.. js:autofunction:: setViewConfig

.. js:autofunction:: getMinMaxValue

.. js:autofunction:: getRangeSelection

.. js:autofunction:: shareViewConfigAsLink

.. js:autofunction:: zoomToDataExtent

.. js:autofunction:: setViewConfig

.. js:autofunction:: zoomTo

.. js:autofunction:: exportAsSvg

.. js:autofunction:: exportAsPng

.. js:autofunction:: exportAsViewConfString

.. js:autofunction:: shareViewConfigAsLink

.. js:autofunction:: on
