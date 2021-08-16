Available to Plugins
======================================

Plugin tracks and data fetchers have access to many core tracks, libraries, and internal
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
- DenseDataExtrema1D
- DenseDataExtrema2D
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
- genomicRangeToChromosomeChunks
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
- maxNonZero
- min
- minNonZero
- mod
- ndarrayAssign
- ndarrayFlatten
- ndarrayToList
- numericifyVersion
- objVals
- or
- parseChromsizesRows
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

Chromosomes
-------

**Prefix:** ``chromosomes`` (e.g., ``HGC.chromosomes.ChromosomeInfo``)

- ChromosomeInfo
- SearchField

Data Fetchers
-------

**Prefix:** ``dataFetchers`` (e.g., ``HGC.dataFetchers.DataFetcher``)

- DataFetcher
- GBKDataFetcher
- LocalDataFetcher
- getDataFetcher

Other
-----

The following imports have no prefix. E.g., to import the HiGlass version simple
do ``HGC.VERSION``

- ``VERSION``: The HiGlass version. Useful for checking the compatibility
