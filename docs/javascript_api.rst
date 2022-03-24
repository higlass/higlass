Javascript API
##############

Overview
========

Embedding HiGlass in web page
*****************************

HiGlass can be included in any web page by including the relevant
javascript and css files:

.. code-block:: html

  <!DOCTYPE html>
  <head>
    <meta charset="utf-8">

    <link rel="stylesheet" href="https://unpkg.com/higlass@1.5.7/dist/hglib.css" type="text/css">
    <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" type="text/css">

    <script crossorigin src="https://unpkg.com/react@16.6/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@16.6/umd/react-dom.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/pixi.js@5/dist/pixi.min.js"></script>
    <!-- To render HiGlass with the Canvas API include the pixi.js-legacy instead of pixi.js -->
    <!-- <script crossorigin src="https://unpkg.com/pixi.js-legacy@5/dist/pixi-legacy.min.js"></script> -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react-bootstrap/0.32.1/react-bootstrap.min.js"></script>

    <script src="https://unpkg.com/higlass@1.6/dist/hglib.min.js"></script>

  </head>
  <body >
    <div id="development-demo" style="width: 800px;
    background-color: white;"></div>
  </body>

  <script>

  const hgApi = hglib.viewer(
    document.getElementById('development-demo'),
    'http://higlass.io/api/v1/viewconfs/?d=default',
    {
      bounded: false,
    }
  );

  </script>
  </html>

External tracks should be included **before** the hglib.js import:

.. code-block:: html

    <script src="https://unpkg.com/higlass-multivec@0.2.0/dist/higlass-multivec.js"></script>

Instructions for instantiating the component and interacting with it are in the
`Public API section <javascript_api.html#api-functions>`_.

Available endpoints
-------------------

.. code-block:: javascript

  import { HiGlassComponent, ChromosomeInfo, viewer, version } from 'higlass';
  import 'higlass/dist/hglib.css';

HiGlass exports four endpoints for your convenience. ``viewer`` is the main
endpoint to create a new HiGlass component. ``HiGlassComponent`` can be used
to integrate HiGlass in your React application. ``ChromosomeInfo`` is a class
for converting absolute coordinates to chromosome coordinates. It's used
internally and made available to convert absolute range selection into
chromosome range selections. ``version`` is a string of the current version of
HiGlass.

In order to get the expected look and feel, we also import the HiGlass CSS files. (Make sure your bundler knows how to handle CSS imports! E.g., if you're using webpack you may need to include the [css-loader]( https://webpack.js.org/loaders/css-loader/).)

Creating an inline HiGlass component
------------------------------------

.. code-block:: javascript

  const hgv = hglib.viewer(element, config, options);

Create a new HiGlass viewer within a web page. This initializes a
HiGlassComponent inside the element ``element`` with a viewconfig passed in as
``config``. If ``config`` is a string, it is interpreted as a url and used to
try to fetch a remote viewconfig.

The ``options`` parameter can have the following properties:

- ``bounded``: tells the HiGlass component to fill all the space in the containing element. Note that if ``bounded`` is set to true, then ``element`` must have a fixed height

- ``pixelPreciseMarginPadding``: if ``true`` apply pixel precise view height, padding, and margin.

- ``containerPaddingX`` and ``containerPaddingY``: x and y padding react grid layout containers. The x padding resembles left and right padding of the entire react grid layout container, i.e., it can be interpreted as the global padding of an HiGlass instance. The y padding stands for the top and bottom padding but in case that the HiGlass view is not bound it will only add padding to the top. You can find out more about the container padding at https://github.com/STRML/react-grid-layout#grid-layout-props.

- ``viewMarginTop``, ``viewMarginBottom``, ``viewMarginLeft``, and ``viewMarginRight``: top, bottom, left, right margin between **views** in pixels. The margin area *is not interactive*, i.e., dragging on the margin area *will not change* the location of the view!

- ``viewPaddingTop``, ``viewPaddingBottom``, ``viewPaddingLeft``, and ``viewPaddingRight``: top, bottom, left, right padding between **views** in pixels. The padding area *is interactive*, i.e., dragging on the margin area *will change* the location of the view!

- ``broadcastMousePositionGlobally``: if ``true`` the relative mouse position of this HiGlass instances (in data coordinates) will be broadcasted globally. This allows you to show the global mouse position in another HiGlass instance within the same browser tab or another browser tab.

- ``showGlobalMousePosition``: if ``true`` any globally broadcasted mouse position will be shown for all tracks that have ``options.showMousePosition = true``.

- ``globalMousePosition``: if ``true`` this will turn on ``broadcastMousePositionGlobally`` and ``showGlobalMousePosition``. This is basically a convenience option to quickly broadcast and show global mouse positions.

- ``PIXI``: Use a different PIXI library. Useful if trying to use a canvas renderer. Example:

.. code-block::

  import * as PIXI from "pixi.js-legacy"

  <HiGlassComponent
    options={
      renderer: 'canvas',
      PIXI
    }
  />

- ``renderer``: if ``canvas`` HiGlass will render to the Canvas API. Otherwise
it will use WebGL. Need to pass in a legacy PIXI import as well. See the ``PIXI`` parameter above.

- ``sizeMode``: the size mode determines the visible height of the HiGlass instance. There are 4 modes:
  1. ``default``: the height is given by the sum of the tracks' heights
  2. ``bounded``: tells the HiGlass component to bind the height to the parent container by dynamically adjusting the height of center tracks.
  3. ``scroll``: will activate scrolling by stretching HiGlass' drawing surface to the extent of ``element`` and hiding overflowing content in the x direction and allowing to scroll when content overflows in the y direction. This mode will also set all views to zoom fixed automatically so that you are not scrolling and zooming at the same time.
  4. ``overflow``: same as ``scroll`` except that you can't scroll. This mode is only needed when you want to dynamically switch between scrolling and pan+zooming. Say you scrolled halfway down and then want to temporarily pan&zoom a track at that position. If you would switch back to ``bounded`` the scrollTop position would be lost because ``bounded`` demands that your entire view is bound to the parent. Instead you want can switch to ``overflow`` to keep the current scrollTop position and enable pan&zooming.

  Visually you can think of the four size modes as follows:

  .. figure:: img/size-mode.png
    :align: center
    :figwidth: 640px

  Note that if ``sizeMode`` is anything other than ``default``, the ``element`` must have a fixed height!

The function returns an instance of the public API of a HiGlass component.

A full example of an inline HiGlass component can be found in the `HiGlass
GitHub repository
<https://github.com/higlass/higlass/blob/develop/app/api.html>`_.


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
  />

Use the ``HiGlassComponent`` to create a HiGlass instance in react. The
``options`` prop is the same as explained above.

**Example**

.. code-block:: javascript

  import { HiGlassComponent } from 'higlass';

  const HiGlass = props => <HiGlassComponent
    ref={props.onRef}
    options={props.options}
    viewConfig={props.viewConfig}
  />

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

.. js:autofunction:: getLocation

.. js:autofunction:: getMinMaxValue

.. js:autofunction:: getRangeSelection

.. js:autofunction:: getTrackObject

.. js:autofunction:: getViewConfig

.. js:autofunction:: shareViewConfigAsLink

.. js:autofunction:: zoomToDataExtent

.. js:autofunction:: setViewConfig

.. js:autofunction:: public.zoomTo

.. js:autofunction:: public.zoomToGene

.. js:autofunction:: public.suggestGene

.. js:autofunction:: exportAsSvg

.. js:autofunction:: exportAsPngBlobPromise

.. js:autofunction:: exportAsViewConfString

.. js:autofunction:: shareViewConfigAsLink

.. js:autofunction:: public.on

.. js:autofunction:: public.off

.. js:autofunction:: setBroadcastMousePositionGlobally

.. js:autofunction:: setShowGlobalMousePosition

.. js:autofunction:: setGlobalMousePosition

.. js:autofunction:: option
