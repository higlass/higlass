Plugin Track Development
########################

Plugin tracks are tracks which have an external code base but otherwise work
just like normal track. We strongly recommend to develop new types of tracks
as plugin tracks and only add very generic track so the HiGlass core library.

Basic skeleton
==============

A plugin track consist of two nested classes defining a wrapper, which loads
HiGlass specific libraries and the actual track class that is similar to any
other track. In the follow you can see a bare minimum example of this structure.

.. code-block:: javascript

    import register from 'higlass-register';

    const MyPluginTrack = function MyPluginTrack(HGC, ...args) {
      if (!new.target) {
        throw new Error(
          'Uncaught TypeError: Class constructor cannot be invoked without "new"'
        );
      }

      // A tracks you want to extend with your plugin track. You should at the
      // very least extend PixiTrack.
      const { BarTrack } = HGC.tracks;

      // Other libraries, utils, etc. that are provided by HiGlass (HGC)
      const { ... } = HGC.libraries;
      const { ... } = HGC.utils;
      const { ... } = HGC.factories;
      const { ... } = HGC.services;
      const { ... } = HGC.utils;
      const { ... } = HGC.configs;

      // The version of HiGlass. Can be used to check for compatibility.
      const hgVersion = HGC.VERSION;

      class RangeTrackClass extends HGC.tracks.BarTrack {
        constructor(context, options) {
          super(context, options);

          ...
        }
      }
    }

    const icon = '<svg ...>...</svg>';

    MyPluginTrack.config = {
      type: 'my-track',
      orientation: '1d-horizontal',
      thumbnail: new DOMParser().parseFromString(icon, 'text/xml').documentElement,
      availableOptions: [ ... ]
      defaultOptions: { ... }
    };

    // It's important that you register your plugin track with HiGlass otherwise
    // HiGlass will not know about it
    register({
      name: 'MyPluginTrack',
      track: MyPluginTrack,
      config: MyPluginTrack.config
    });

    export default MyPluginTrack;

The best way to get start implementing a plugin tracks is to take a look at
existing plugin tracks and their code. You can find a list of all officially
supported plugin tracks can be found at
`higlass.io/plugins <http://higlass.io/plugins>`_

In order to make the track display anything interesting you need to extend
the existing rendering methods. To find out how HiGlass renders data please
take a look at some core tracks like ``BarTrack.js``.


Available tracks, libraries, and utils
======================================

Plugin tracks have access to many core tracks, libraries, and internal
utilities. Below is an overview of all available imports.

Tracks
------

**Prefix:** ``tracks`` (e.g., ``HGC.tracks.BarTrack``)

- Annotations2dTrack
- ArrowheadDomainsTrack
- BarTrack
- BedLikeTrack
- CNVIntervalTrack
- CombinedTrack
- DivergentBarTrack
- HeatmapTiledPixiTrack
- Horizontal2DDomainsTrack
- HorizontalChromosomeLabels
- HorizontalGeneAnnotationsTrack
- HorizontalHeatmapTrack
- HorizontalLine1DPixiTrack
- HorizontalMultivecTrack
- HorizontalPoint1DPixiTrack
- HorizontalTiledPlot
- HorizontalTrack
- Id2DTiledPixiTrack
- IdHorizontal1DTiledPixiTrack
- IdVertical1DTiledPixiTrack
- LeftAxisTrack
- MapboxTilesTrack
- MoveableTrack
- OSMTilesTrack
- PixiTrack
- SVGTrack
- SquareMarkersTrack
- Tiled1DPixiTrack
- TiledPixiTrack
- TopAxisTrack
- Track
- ValueIntervalTrack
- VerticalTiled1DPixiTrack
- VerticalTrack

Libraries
---------

**Prefix:** ``libraries`` (e.g., ``HGC.libraries.PIXI``)

- d3Array
- d3Axis
- d3Brush
- d3Color
- d3Drag
- d3Dsv
- d3Format
- d3Geo
- d3Queue
- d3Request
- d3Scale
- d3Selection
- d3Transition
- d3Zoom
- PIXI
- mix

Factories
---------

**Prefix:** ``factories`` (e.g., ``HGC.factories.LruCache``)

- ContextMenuItem
- DataFetcher
- LruCache

Services
--------

**Prefix:** ``services`` (e.g., ``HGC.services.chromInfo``)

chromInfo
createDomEvent
ElementResizeListener
tileProxy
requestsInFlight
setTileProxyAuthHeader
getTileProxyAuthHeader
authHeader
getDarkTheme
setDarkTheme

Utils
-----

**Prefix:** ``utils`` (e.g., ``HGC.utils.absToChr``)

- absToChr
- accessorTransposition
- addArrays
- addClass
- base64ToCanvas
- chromInfoBisector
- chrToAbs
- cloneEvent
- colorDomainToRgbaArray
- colorToHex
- dataToGenomicLoci
- debounce
- dictFromTuples
- dictItems
- dictKeys
- dictValues
- download
- fillInMinWidths
- flatten
- forEach
- forwardEvent
- genomeLociToPixels
- getElementDim
- getTrackByUid
- getTrackObjById
- getTrackPositionByUid
- getXylofon
- gradient
- hasClass
- hasParent
- hexStrToInt
- intoTheVoid
- isTrackOrChildTrack
- isWithin
- latToY
- loadChromInfos
- lngToX
- map
- max
- min
- mod
- ndarrayAssign
- ndarrayFlatten
- ndarrayToList
- numericifyVersion
- objVals
- or
- pixiTextToSvg
- positionedTracksToAllTracks
- q
- reduce
- rangeQuery2d
- relToAbsChromPos
- removeClass
- resetD3BrushStyle
- rgbToHex
- scalesCenterAndK
- scalesToGenomeLoci
- showMousePosition
- some
- sum
- svgLine
- tileToCanvas
- totalTrackPixelHeight
- toVoid
- trimTrailingSlash
- valueToColor
- expandCombinedTracks
- segmentsToRows
- getTrackObjectFromHGC
- getTrackRenderer
- getTiledPlot

Configs
-------

**Prefix:** ``configs`` (e.g., ``HGC.configs.MAX_CLICK_DELAY``)

- MAX_CLICK_DELAY
- MOUSE_TOOL_MOVE
- MOUSE_TOOL_SELECT
- TILE_FETCH_DEBOUNCE
- ZOOM_DEBOUNCE
- SHORT_DRAG_TIMEOUT
- LONG_DRAG_TIMEOUT
- LOCATION_LISTENER_PREFIX
- ZOOM_TRANSITION_DURATION
- DEFAULT_SERVER
- VIEW_HEADER_MED_WIDTH_SEARCH_BAR
- VIEW_HEADER_MIN_WIDTH_SEARCH_BAR
- TRACK_LOCATIONS
- MIN_HORIZONTAL_HEIGHT
- MIN_VERTICAL_WIDTH
- AVAILABLE_TRACK_TYPES
- DATATYPE_TO_TRACK_TYPE
- HEATED_OBJECT_MAP
- IS_TRACK_RANGE_SELECTABLE
- OPTIONS_INFO
- TRACKS_INFO
- TRACKS_INFO_BY_TYPE
- POSITIONS_BY_DATATYPE
- DEFAULT_TRACKS_FOR_DATATYPE

Other
-----

The following imports have no prefix. E.g., to import the HiGlass version simple
do ``HGC.VERSION``

- ``VERSION``: The HiGlass version. Useful for checking the compatibility
