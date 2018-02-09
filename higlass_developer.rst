Developer
#########

Public API
***********

Creating an inline HiGlass component
------------------------------------

.. code-block:: javascript

  const hgv = hglib.viewer(element, config, options);

Create a new HiGlass component within a web page. This initializes a
HiGlassComponent inside the element ``element`` with a viewconfig passed in as
``config``. If ``config`` is a string, it is interpreted as a url and used to
try to fetch a remote viewconfig.

The ``options`` parameter can currently only specify the ``bounded`` property
which tells the HiGlass component to fill all the space in the containing
element. Note that if ``bounded`` is set to true, then ``element`` must have a
fixed height. ``callback`` is used to return an api variable which can be used
to access HiGlass events.

The function returns an instance of the public API of a HiGLass component.

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

Reference
---------

The following is a list of the public API methods:

.. code-block:: javascript

  const hgv = hglib.viewer(element, config, options);

  hgv.setViewConfig(newViewConfig);
  hgv.zoomToDataExtent(newViewConfig);
  hgv.goTo(viewUid, chrom1, start1, end1, chrom2, start2, end2, animate = false, animateTime = 3000);
  hgv.activateTool(mouseTool);
  hgv.on(event, callback, viewId, callbackId);
  hgv.off(event, listenerId, viewId);
  hgv.get(prop, viewId);
  hgv.shareViewConfigAsLink(url);

setViewConfig(viewConfig): Setting a view config
------------------------------------------------

The HiGlass API can be used to set a new viewconfig. This returns a Promise
which is fulfilled when all of the data for the view is loaded.

.. code-block:: javascript

  const p = hgv.setViewConfig(newViewConfig);
  p.then(() => {
    // the initial set of tiles has been loaded
  });

zoomToDataExtent(viewId): Zooming to show all of the data
---------------------------------------------------------

One may set a view config pointing to a dataset which is either out of the
bounds of the view, too small, or too zoomed in. To fit the data inside of
the view, the HiGlass API exposes the  ``zoomToDataExtent`` function.

.. code-block:: javascript

  hgv.zoomToDataExtent('viewUid');

The passed in ``viewUid`` should refer to a view which is present. If it
doesn't, an exception will be thrown.


goTo(view,chr1,s1,e1,chr2,s2,e2,animate,animateTime): Zoom to a genomic location
--------------------------------------------------------------------------------

Change the current view port to a certain genomic location. When ``animate`` is true HiGlass transitions from the current to the new location smoothly.

.. code-block:: javascript

  hgv.goTo(
    viewUid,
    chrom1,
    start1,
    end1,
    chrom2,
    start2,
    end2,
    animate = false,
    animateTime = 3000,
  );

**Example:**

.. code-block:: javascript

  hgv.goTo('v1', 'chr1', 0, 1, 'chr2', 0, 1, true, 500);

activateTool(mouseTool): Select a mouse tool
--------------------------------------------

Some tools needs conflicting mouse events such as mousedown or mousemove. To avoid complicated triggers for certain actions HiGlass supports different mouse tools for different interactions. The default mouse tool enables pan&zoom. The only other mouse tool available right now is ``select``, which lets you brush on to a track to select a range for annotating regions.

.. code-block:: javascript

    hgv.activateTool(mouseTool);

**Examples:**

.. code-block:: javascript

  hgv.activateTool('select'); // Select tool is active
  hgv.activateTool(); // Default pan&zoom tool is active

on(event, callback, viewId, callbackId): Subscribe to an event
--------------------------------------------------------------

HiGlass exposes the following event, which one can subscribe to via this method:

- location
- rangeSelection
- viewConfig
- mouseMoveZoom

.. code-block:: javascript

  hgv.on(eventName, callback, viewId, callbackId)

**location:** Returns a BEDPE array of the current view port.

.. code-block:: javascript

  ["chr1", 229372197, "chrM", 16571, "chr1", 1, "chrM", 16571]

**rangeSelection:** Returns a BED- (1D) or BEDPE (1d) array of the selected data and genomic range (if chrom-sizes are available)

.. code-block:: javascript

  // Global output
  {
    dataRange: [...]
    genomicRange: [...]
  }

  // 1D data range
  [[1218210862, 1528541001], null]

  // 2D data range
  [[1218210862, 1528541001], [1218210862, 1528541001]]

  // 1D or BED-like array
  [["chr1", 249200621, "chrM", 50000], null]

  // 2D or BEDPE-like array
  [["chr1", 249200621, "chr2", 50000], ["chr3", 197972430, "chr4", 50000]]

**viewConfig:** Returns the current view config.

**mouseMoveZoom:** Returns the raw data around the mouse cursors screen location and the related genomic location.

.. code-block:: javascript

  {
    data, // Raw Float32Array
    dim,  // Dimension of the lens (the lens is squared)
    toRgb,  // Current float-to-rgb converter
    center,  // BED array of the cursors genomic location
    xRange,  // BEDPE array of the x genomic range
    yRange,  // BEDPE array of the y genomic range
    rel  // If true the above three genomic locations are relative
  }

**Examples:**

.. code-block:: javascript

  let locationListenerId;
  hgv.on(
    'location',
    location => console.log('Here we are:', location),
    'viewId1',
    listenerId => locationListenerId = listenerId
  );

  const rangeListenerId = hgv.on(
    'rangeSelection',
    range => console.log('Selected', range)
  );

  const viewConfigListenerId = hgv.on(
    'viewConfig',
    range => console.log('Selected', range)
  );

  const mmz = event => console.log('Moved', event);
  hgv.on('mouseMoveZoom', mmz);

off(event, listenerId, viewId): Unsubscribe from an event
---------------------------------------------------------

Cancel a subscription.

.. code-block:: javascript

  hgv.off(eventName, listenerId, viewId)

**Examples:**

The variables used in the following examples are coming from the above examples of ``on()``.

.. code-block:: javascript

  hgv.off('location', locationListenerId, 'viewId1');
  hgv.off('rangeSelection', rangeListenerId);
  hgv.off('viewConfig', viewConfigListenerId);
  hgv.off('mouseMoveZoom', mmz);

get(prop, viewId): Instant getter for event data
------------------------------------------------

Naturally, event listeners only return news once an event has been published but sometimes one needs to get the data at a certain time. The get method returns the current value of an event without having to wait for the event to fire.

Additionally, it's possible to retrieve a png or svg snapshot of the current view using ``png`` and ``svg`` as ``prop`` respectively. The png snapshot comes in form of a data URI and the svg snapshot is a XML string.

.. code-block:: javascript

  const currentLocationOfViewId = hgv.get('location', 'viewId');
  const currentRangeSelection = hgv.get('rangeSelection');
  const currentViewConfig = hgv.get('viewConfig');
  const pngSnapshot = hgv.get('png');  // Data URI
  const svgSnapshot = hgv.get('svg');  // XML string

shareViewConfigAsLink(url): Get sharable link for current view config
---------------------------------------------------------------------

Generate a sharable link to the current view config. The `url` parameter should contain
the API endpoint used to export the view link (e.g. 'http://localhost:8989/api/v1/viewconfs').
If it is not provided, the value is taken from the `exportViewUrl` value of the viewconf.

.. code-block:: javascript

  hgv.shareViewConfigAsLink()
    .then((sharedViewConfig) => {
      console.log(`Shared view config (ID: ${sharedViewConfig.id}) is available at ${sharedViewConfig.url}`)
    })
    .catch((err) => { console.error('Something did not work. Sorry', err); })

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

Viewconfs
*********

Viewconfs specify exactly what a HiGlass view should show. They contain a list
of the data sources, visualization types, visible region as well as searching
and styling options.

Show a specific genomic location
--------------------------------

Say we want to have a viewconf which was centered on the gene OSR1. It's
location is roughly between positions 19,500,000 and 19,600,000 on chromosome 7
of the hg19 assembly. So what should ``initialXDomain`` be set to in order to
show this gene?

Because `initialXDomain` accepts absolute coordinates calculated by
concatenating chromosomes according to a certain order, we need to calculate
what chr2:19,500,000 and chr2:196,000,000 are in absolute coordinates.

To do this we will assume a chromosome ordering consisting of chr1, chr2, ...
This means that we need to take the length of chr1 in hg19, which is
249,250,621 base pairs, and add our positions to that, yielding
positions 268,750,621 and 268,850,621 for the ``initialXDomain``.

The chromosome order commonly used in HiGlass for hg19 can be found in the
`negspy repository
<https://github.com/pkerpedjiev/negspy/blob/master/negspy/data/hg19/chromInfo.txt>`_.

Upload a viewconf to the server
-------------------------------

A local viewconf can be sent to the server by sending a ``POST`` request. Make
sure the actual viewconf is wrapped in the ``viewconf`` section of the posted
json (e.g. '{"viewconf": myViewConfig}'):

.. code-block:: bash

    curl -H "Content-Type: application/json" \
         -X POST \
         -d '{"viewconf": {"editable": true, "zoomFixed": false, "trackSourceServers": ["/api/v2", "http://higlass.io/api/v1"], "exportViewUrl": "/api/v1/viewconfs/", "views": [{"tracks": {"top": [], "left": [], "center": [], "right": [], "bottom": []}, "initialXDomain": [243883495.14563107, 2956116504.854369], "initialYDomain": [804660194.1747572, 2395339805.825243], "layout": {"w": 12, "h": 12, "x": 0, "y": 0, "i": "EwiSznw8ST2HF3CjHx-tCg", "moved": false, "static": false}, "uid": "EwiSznw8ST2HF3CjHx-tCg"}], "zoomLocks": {"locksByViewUid": {}, "locksDict": {}}, "locationLocks": {"locksByViewUid": {}, "locksDict": {}}, "valueScaleLocks": {"locksByViewUid": {}, "locksDict": {}}}}' http://localhost:8989/api/v1/viewconfs/



Coding Guidelines
*****************

Spacing
-------

Code should be indented with 2 spaces. No tabs!

Docstrings
----------

All functions should be annotated with a docstring in the `JSDoc style <http://usejsdoc.org/>`_.


Track Documentation
*******************

Each track in HiGlass is written in a Javascript class. This class is
responsible for requesting data from the server as well as for rendering it.
The interface between the `viewconfig` definition of the views and the actual
track rendering is the `track-type`. In `app/scripts/TrackRenderer.js`, the
value of `track-type` is used to instantiate a TrackObject. `TrackRenderer`
then interacts with this track object to let it know when it has been resized
and what the current zoom level is.

Due to the variety of `track types <track_types.html>`_ available in HiGlass,
there are different ways in which data can be rendered and manipulated.

Adding new track types
**********************

To add a new track type, we first need a data source and a new
definition. To begin, we can create a new test page to work
with.

.. code-block:: bash

    cp app/test2.html app/testx.html

Within this page will be a sample viewconfig, that we need to add our new track
definition to. In this example, we'll be adding a 1D track. This just means
that it can only be zoomed into in one dimension. We'll give it a type of
``horizontal-multivec`` and add it to the list of top tracks with the bare
minimum of attributes. The tilesetUid was taken from the `higlass server new
filetypes section <higlass_server.html#new-filetypes>`_.


.. code-block:: javascript

        "top": [
                  {
            "server": "http://localhost:8000/api/v1",
            "tilesetUid": "RAh2nvU9THezcVuxBU3ioQ",
            "type": "horizontal-multivec",
            "height": 200,
            "position": "top"
          }
        ],

We can start higlass:

.. code-block:: bash

    npm install
    npm start

And then navigate to the test web page: http://localhost:8080/testx.html
Upon opening the developer console, we'll see an error message:

```
WARNING: unknown track type: horizontal-multivec
```

This is because HiGlass doesn't know how to handle this track type. In
this example, we'll give it a way of handling it.

First, we need to define this track type in the ``TRACKS_INFO`` array in ``app/scripts/tracks-info.js``:

.. code-block:: javascript

  {
    type: 'horizontal-multivec',
    datatype: ['multivec'],
    local: false,
    orientation: '1d-horizontal',
    thumbnail: null,
    availableOptions: ['labelPosition', 'labelColor', 'valueScaling', 'labelTextOpacity', 'labelBackgroundOpacity', 'trackBorderWidth', 'trackBorderColor', 'trackType'],
    defaultOptions: {
      labelPosition: 'topLeft',
      labelColor: 'black',
      labelTextOpacity: 0.4,
      valueScaling: 'linear',
      trackBorderWidth: 0,
      trackBorderColor: 'black',
    },
  },

It has all of the standard track options, is horizontal, etc...

Now if we reload our test page, we still get the same warning. This is because
we don't actually know how to draw this track. We need to create a class which
knows how to draw this track type. We can do that by creating a new file in
``app/scripts`` called ``HorizontalMultivecTrack.js``.

The easiest way to do this is to start with an existing track type and copy it.
This example uses a HeatmapTrack as a template. For other types of data, it's
best to start with a track that is similar to the type that you are trying to
create. A list of track types can be found in the `track types section of this
documentation <track_types.html>`_.

.. code-block:: bash

    cp app/scripts/HeatmapTiledPixiTrack.js app/scripts/HorizontalMultivecTrack.js

Here we need to change the name of the track and have it extend the HeatmapTrack:

.. code-block:: bash

    export class HorizontalMultivecTrack extends HeatmapTiledPixiTrack

Now we can register the new track type in `TrackRenderer.js:createTrackObject`:

.. code-block:: javascript

      case 'horizontal-multivec':
        return new HorizontalMultivecTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
          this.svgElement,
          () => this.currentProps.onValueScaleChanged(track.uid),
          newOptions =>
            this.currentProps.onTrackOptionsChanged(track.uid, newOptions),
        );

And add it to the imports at the top:

.. code-block:: javascript

    import HorizontalMultivecTrack from './HorizontalMultivecTrack';

Reloading our test page will now output a series of errors which we will fix
in `HorizontalMultivecTrack`. Here's the steps.

1. Replace ``tileToLocalId`` and ``tileToRemoteId`` with those from
   ``HorizontalLine1DPixiTrack``.  We do this because the ones we copied from
   the HeatmapTrack assume that there will be a data transform associated with
   the ID. This simple datatype has no associated transforms and thus only
   needs to encode the tile position in the ID.

2. Change ``calculateZoomLevel`` to only use the x domain in calculating the zoom
   level.

3. Change ``calculateVisibleTiles`` to only use the x domain in calculating the
   visible tiles.

4. Change ``tileDataToCanvas`` to change the width of the data to match that
   returned in the tileset info.

5. Change the ``zoomed`` function to maintain the the view at the origin.

6. Change ``setSpriteProperties`` to position the sprite on only the x axis.



Other Documentation
*******************


Line Track Scaling
------------------


1D tracks can either be linearly or log scaled. Linear scaling denotes a linear
mapping between the values and their position on the track. Log scaling means
that we take the log of the values before positioning them.

Because the dataset may contain very small or even zero values, we add a
pseudocount equal to the median visible value to ensure that finer details in
the data are not drowned out by extreme small values.

The code for this can be found in ``HorizontalLine1DPixiTrack.drawTile``.


Interface
---------

visibleAndFetchedIds: Tile ids that correspond to tiles which are both visible
in the current viewport as well as fetched from the server.

visibleTileIds: Tiles which should be visible in the current viewport based on
the current viewport. Usually set by ``calculateVisibleTiles``.
