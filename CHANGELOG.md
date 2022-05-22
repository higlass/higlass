# Release notes

## v1.11.11

- Bump terser-webpack-plugin version to fix build issue

## v1.11.10

- Remove dependency on `cwise`
- Fix color issue in GeneAnnotation SVG export

## v1.11.8

- Remove react-bootstrap from the GenomePositionSearchBox
- Make vertical chromosome labels as well as loading status labels readable in vertical tracks
- Added an option menu item for rectangle domain fill opacity
- Added a parameter in `zoomToGene` to allow specifying padding around gene
- Add data fetchers to `AVAILABLE_FOR_PLUGINS`
- Update track list in `AVAILABLE_FOR_PLUGINS`
- Correctly setup initial scales of vertical tracks when the width of a center track is zero.
- Config-wise, allow axis-specific location locks (e.g., lock the vertical axis in a view to the horizontal axis in another).
- Add `reload` implementation to `HiGlassComponenet` API.

_[Detailed changes since v1.11.5](https://github.com/higlass/higlass/compare/v1.11.7...develop)_

## v1.11.7

- Show visual clue when tileset info is not available ("Tileset info not found. ...").
- Properly initialize the style of 1D brushes (`viewport-projection-horizontal` and `viewport-projection-vertical`).

_[Detailed changes since v1.11.5](https://github.com/higlass/higlass/compare/v1.11.6...v1.11.7)_

## v1.11.6

- Allow implementing plugin viewport projection tracks using `config.projection`.
- Change the default value of `zoomLimits` to `[1, null]`, which means highest zoom resolution is 1bp.

_[Detailed changes since v1.11.5](https://github.com/higlass/higlass/compare/v1.11.5...v1.11.6)_

## v1.11.5

- Add a `zoomToGene` API that allows to zoom a HiGlass view to a location near a certain gene.
- Add a `suggestGene` API that returns a list of genes of top match for a given keyword based on `autocompleteServer`.
- Add a top-level option, `compactLayout`, that controls to allow adding vertical gaps between views.

_[Detailed changes since v1.11.4](https://github.com/higlass/higlass/compare/v1.11.4...v1.11.5)_

## v1.11.4

- Fix colorbar error on degenerate colorscale
- Update horizontal heatmap to regular heatmap rendering so that they can use the same options

_[Detailed changes since v1.11.3](https://github.com/higlass/higlass/compare/v1.11.3...v1.11.4)_

## v1.11.3

- Show a more comprehensive list of track types in the track config menu
- Break up HiGlassComponentTests
- Show only integer ticks in `HorizontalChromosomeLabels` tracks because it is misleading to have decimal values in genomic coordinates.
- Add a `reverseOrientation` option in `HorizontalChromosomeLabels` tracks to allow aligning tick labels and lines on the top or left.
- Make overlays SVG exportable
- Fix a bug that led to the app crash when `selectRows` is set to an empty array `[]`
- Break up and turn off some tests
- Fix gene annotation mouseover

_[Detailed changes since v1.11.2](https://github.com/higlass/higlass/compare/v1.11.2...v1.11.3)_

## v1.11.2

- Fix registration of plugin tracks
- Don't try to render names of filler annotations

_[Detailed changes since v1.11.1](https://github.com/higlass/higlass/compare/v1.11.1...v1.11.2)_

## v1.11.1

- Fix multivec SVG export
- Added `ChromosomeInfo` and `SearchField` classes to `AVAILABLE_TO_PLUGINS`.

_[Detailed changes since v1.11.0](https://github.com/higlass/higlass/compare/v1.11.0...v1.11.1)_

## v1.11.0

- Make gene annotations rotatable so that they can be added on the left
- Tracks can now modify their own dimensions by publishing `trackDimensionsModified`.
- Fixed a bug preventing usage of `data.url` and HorizontalMultivecTrack server-side aggregation simultaneously.
- Fixed a bug preventing an updated value of `track.options.selectRows` from triggering a HorizontalMultivecTrack track update when using server-side aggregation (`track.options.selectRowsAggregationMethod === 'server'`).
- Added the JS API `.on('geneSearch', callback)` option for subscribing to gene search events.
- Simplify plugin track registry
- Implemented plugin data fetchers.

_[Detailed changes since v1.10.2](https://github.com/higlass/higlass/compare/v1.10.2...v1.11.0)_

## v1.10.2

- Remove view config validation from `hgApi.getViewConfig()` and `hgApi.setViewConfig()` and instead move it into a new method called `hgApi.validateViewConfig(viewConfig, { verbose: false } = {})`

_[Detailed changes since v1.10.1](https://github.com/higlass/higlass/compare/v1.10.1...v1.10.2)_

## v1.10.1

- Remove text/plain encoding from tile proxy text fetcher
- Added the `selectRowsAggregationMethod` option for the `horizontal-multivec` track to enable server-side aggregation if set to `"server"` rather than the default `"client"`.
- In the view config, moved the `fileUrl` track property under the `data` property: `data: { url, server, filetype }`.

_[Detailed changes since v1.10.0](https://github.com/higlass/higlass/compare/v1.10.0...v1.10.1)_

## v1.10.0

- Fixed horizontal and vertical cross sections
- Changed the style for the mouse over dialog to have a maximum width of 50 and to break words so that it doesn't go off the screen if there's a very long mouseover text.
- Lower the default annotation height in the Gene Annotations track
- Colors for rules
- Ability to load genome position search box chromosome sizes from an arbitrary location
- Plugin tracks can provide their own config menu options
- Remove horizontal-_ and vertical-_ prefixes from track names
- Load matrices with "None" data transform without crashing
- Add a view for showing schema log messages when JSON codes are edited in a config view.

_[Detailed changes since v1.9.5](https://github.com/higlass/higlass/compare/v1.9.5...v1.10.0)_

## v1.9.5

- Removed styles for naked td tag
- Reader for text genbank data (i.e. not pulled from a url)

_[Detailed changes since v1.9.4](https://github.com/higlass/higlass/compare/v1.9.4...v.1.9.5)_

## v1.9.4

- Added the `resolveImmediately` parameter to the setViewConfig API call.
- Zooming can now be restricted by specifying `zoomLimits` in the viewconf.
- Fixed bug where the track config menu improperly positioned when clicked twice.
- Update the heatmap option interface to allow seeing the preview when a color picker is opened.
- Display an error message on tiles with errors in them
- Don't try to assign a color value scale if the colorEncoding is set to itemRgb. itemRgb means that the color is present directly in the annotation
- Add an option to separate the + / - strand annotations in the bedlike track

_[Detailed changes since v1.9.3](https://github.com/higlass/higlass/compare/v1.9.3...v.1.9.4)_

## v1.9.3

- Consolidated track options of horizontal and vertical tracks
- Set background of new heatmap tracks in a combined track to `transparent` when added via the track context menu.
- Fixed bug where heatmap labels could not be hidden.
- The position of labels and colorbars for split heatmaps can now be changed.
- Use itemRgb field in bed files as the default coloring for bedlike tracks

_[Detailed changes since v1.9.2](https://github.com/higlass/higlass/compare/v1.9.2...v.1.9.3)_

## v1.9.2

- Fixed divided tracks bug by adding denseDataExtrema
- Fixed divergent bar track
- Made the bar track compatible with the local tile fetcher
- Added fontColor, fontSize and fillOpacity options to BedLikeTrack
- Added cheat code for making the component editable (i.e. with headers)
- Fixed track names in config menu
- Keep locks on track type change
- Fix crashing higlass on non-existent value scale lock member

_[Detailed changes since v1.9.1](https://github.com/higlass/higlass/compare/v1.9.1...v1.9.2)_

## v1.9.1

- Used stretchRects to ensure that there are no rendering artifacts when zooming in too far
- Added scaled as a potential value to the annotationHeight option
- Added the maxAnnotationHeight option to limit the size of annotations when using the scaled option for annotationHeight
- Added the fontSize option for bedlike tracks
- colorAnnotations are independent of valueScale
- Vertical zooming on BedLike annotations
- Added support for aggregation of `horizontal-multivec` rows by passing arrays of row indices to the `selectRows` option. With this addition also comes the track options `selectRowsAggregationMode` (for specifying an aggregation function, "mean", "sum", "variance", "deviation") and `selectRowsAggregationWithRelativeHeight` (boolean) to determine whether rows representing groups of indices have 1-unit heights or `group.length`-unit heights.
- Added the JS API `.on('wheel', callback)` option for subscribing to mouse wheel events.

_[Detailed changes since v1.9.0](https://github.com/higlass/higlass/compare/v1.9.0...v1.9.1)_

## v1.9.0

- Support for gene annotation "filler" regions
- Clickable gene annotations
- Slightly updated gene annotation style with arrowheads at the ends
- Remove Content-Type headers when fetching genbank files
- Added the fields `xRange` and `yRange` the object returned by the JavaScript API `.getLocation()` method.
- Fixed blurry exported heatmap SVG graphics issue using the `image-rendering` CSS property.
- Enabled view-based scaling
- Left and right tracks can now be value scale locked
- Added the attributes `projectionXDomain` and `projectionYDomain` to the `viewport-projection-horizontal` and `viewport-projection-vertical`, respectively, and both to the `viewport-projection-center`, to support the case in which the `fromViewUid` attribute is undefined.
- Added the `.on('createSVG')` listener to the JS API, with the corresponding `.off('createSVG')`, for manipulating exported SVGs before they are returned.
- Added `zeroValueColor` as an option for the `horizontal-multivec` track, to specify the color mapping for zero data values.
- Track resizing events now trigger the `.on('viewConfig')` JS API callback.
- Allowed K and M notations when entering genomic coordinates in searchbox (e.g., "chr1:150M-155M").
- Specify raw tiles locally in the viewconf

_[Detailed changes since v1.8.4](https://github.com/higlass/higlass/compare/v1.8.4...v1.9.0)_

## v1.8.4

- Corrupted lock bug fix
- Export to SVG with no loaded tiles bug fix
- `selectRows` option for Horizontal Multivec Tracks

_[Detailed changes since v1.8.3](https://github.com/higlass/higlass/compare/v1.8.3...v1.8.4)_

## v1.8.3

- Added "empty" track

_[Detailed changes since v1.8.2](https://github.com/higlass/higlass/compare/v1.8.2...v1.8.3)_

## v1.8.2

- Fixed horizontal track not rendering properly in vertical position bug

_[Detailed changes since v1.8.1](https://github.com/higlass/higlass/compare/v1.8.1...v1.8.2)_

## v1.8.1

- Prettified JS code
- Added `labelShowAssembly` as an option to allow hiding the assembly in track label (e.g. `hg19 |` text)
- Added `tickFormat` and `tickPosition` options to the chromosome labels track
- Enabled the colorbar slider by adding the options `colorbarPosition` and `colorbarBackgroundColor` for the `horizontal-multivec`
- Added release notes to docs.
- Added support for selecting and filtering rows of the `horizontal-multivec` track via the `selectRows` option.

_[Detailed changes since v1.8.0](https://github.com/higlass/higlass/compare/v1.8.0...v1.8.1)_

## v1.8.0

- Added the option to flip 2D annotations across the diagonal
- Update heatmap docs with colorRange parameter
- Update BedLikeTrack to display strand-specific entries
- Added 'segment' style to the BedLikeTrack
- Updated default plot types when adding tracks
- When adding multiple tracks at once that have different datatype, each track is added with its default plot type. The plot type chooser is hidden.
- In `HorizontalLine1DPixiTrack`, make sure that `this.valueScale` is set when `getMouseOverHtml()` is called.
- VerticalRule, HorizontalRule, and CrossRule tracks included in SVG and PNG exports.

_[Detailed changes since v1.7.2](https://github.com/higlass/higlass/compare/v1.7.2...v1.8.0)_

## v1.7.2

- Refactored the scroll options and `bounded` into a new property called `sizeMode`. There are now 4 different size modes, which determine the visible height of the HiGlass instance:
  1. `default`: the height is given by the sum of the tracks' heights
  2. `bounded`: tells the HiGlass component to bind the height to the parent container by dynamically adjusting the height of center tracks.
  3. `scroll`: will activate scrolling by stretching HiGlass' drawing surface to the extent of parent DOM element and hiding overflowing content in the x direction and allowing to scroll when content overflows in the y direction.
  4. `overflow`: same as `scroll` except that you can't scroll. This mode is only needed when you want to dynamically switch between scrolling and pan+zooming.

_[Detailed changes since v1.7.0](https://github.com/higlass/higlass/compare/v1.7.0...v1.7.2)_

## v1.7.1

_Same as v1.7.0. This is just due to a glitch at npmjs.org._

## v1.7.0

- Add support for scrollable views. Activate via the option `scrollable: true`. Once you activate scrollable views all views are automatically zoomfixed! See [http://localhost:8080/others/scrollable-container.html](others/scrollable-container.html) for an example.
- Add `option(key, value)` to the JS API for changing options. It supports getting all options when `value` is ommited and setting `scrollable`.
- Properly display "Loading" while loading tileset info
- Add support to ignore offscreen values for value scale locking by setting `ignoreOffScreenValues: true` for a lock group in `locksDict`.

_[Detailed changes since v1.6.12](https://github.com/higlass/higlass/compare/v1.6.12...v1.7.0)_

## v1.6.12

- Rename React lifecycle methods according to their recommendations
- Add support for borders (via the `stroke`, `strokeWidth`, `strokeOpacity`, and `strokePos` options) and outlines (via the `outline`, `outlineWidth`, `outlineOpacity`, and `outlinePos` options) to overlays. See [http://localhost:8080/apis/svg.html?/viewconfs/fancy-overlays.json](http://localhost:8080/apis/svg.html?/viewconfs/fancy-overlays.json) for an example.
- Fixed horizontal rule bug (from Slack)

_[Detailed changes since v1.6.11](https://github.com/higlass/higlass/compare/v1.6.11...v1.6.12)_

## v1.6.11

- Overlay track bug fixes
- Added `minWidth` and `minHeight` options to `overlays` for better guidance
- Allow viewconf JSON to override minimum track height or width defaults, when a track specifies a `minHeight` or `minWidth` parameter

_[Detailed changes since v1.6.10](https://github.com/higlass/higlass/compare/v1.6.10...v1.6.11)_

## v1.6.10

- Add API call for show track chooser (`hgApi.showTrackChooser()`)
- Limit icon size in plot type chooser
- Add non-gzipped support to genbank-fetcher
- Better error handling for genbank fetcher

_[Detailed changes since v1.6.9](https://github.com/higlass/higlass/compare/v1.6.9...v1.6.10)_

## v1.6.9

- Enable brushing on bar, point, and 1d-heatmap tracks

_[Detailed changes since v1.6.8](https://github.com/higlass/higlass/compare/v1.6.8...v1.6.9)_

## v1.6.8

- Add infrastructure for value scale zooming
- Fixed the colors when dragging a track over a higlass display
- Added support for value scale zooming
- Added utils/track-utils to provide track functionality for use without inheritance
- Implemented a genbank data fetcher for gene annotation tracks

_[Detailed changes since v1.6.7](https://github.com/higlass/higlass/compare/v1.6.7...v1.6.8)_

## v1.6.7

- Fix #747: the tooltip value wasn't shown because of an issue related to minimizing the code
- Fix #743: the tooltip position now incorporates the scroll position
- Fix drag handle styling (typo)
- Make drag handle area (not the style) bigger so it's easier to grab

_[Detailed changes since v1.6.6](https://github.com/higlass/higlass/compare/v1.6.6...v1.6.7)_

## v1.6.6

- Fix #732: Remove the hold ALT feature as it's confusion and leads to a weird bug.
- Fix leaking dark mode setting
- Change option to activate dark theme from `isDarkTheme: true` to `theme: 'dark'`. Also, use `setTheme()` of the JsAPI instead of `setDarkTheme()` from now on.
- Copy the tile data before mutation to fix an issue when displaying the same tileset twice (once in the upper right and lower left triangle)

_[Detailed changes since v1.6.5](https://github.com/higlass/higlass/compare/v1.6.5...v1.6.6)_

## v1.6.5

- Fixed the replace track bug (where replacing a center track wouldn't do anything)

_[Detailed changes since v1.6.4](https://github.com/higlass/higlass/compare/v1.6.4...v1.6.5)_

## v1.6.4

- Truly fix #593: zoom to data extent when adding the first track to an empty view

_[Detailed changes since v1.6.3](https://github.com/higlass/higlass/compare/v1.6.3...v1.6.4)_

## v1.6.3

- Dynamically update dark theme when the options change
- Fix #722: added `labelShowResolution` as an option to allow hiding the `[Current data resolution...]` text
- Add support for missing values (`NaN`s) to the 1D heatmap track
- Use the new link format

_[Detailed changes since v1.6.2](https://github.com/higlass/higlass/compare/v1.6.2...v1.6.3)_

## v1.6.2

- Render `horizontal-heatmap` track properly in PIXI v4 and v5
- Expose pixi renderer to plugin tracks to allow them to render textures from graphics objects. (More here: https://github.com/pixijs/pixi.js/issues/5394)

_[Detailed changes since v1.6.1](https://github.com/higlass/higlass/compare/v1.6.1...v1.6.2)_

## v1.6.1

- Fix visual glitches with the new Modal when run in `higlass-app`
- Really fix #651: set correct namespace for SVG exports
- Treat `tilesetInfo.mirror_tiles = false` as a falsy value
- Fixed: `Save and Close` in the ViewConfigEditor works properly

_[Detailed changes since v1.6.0](https://github.com/higlass/higlass/compare/v1.6.0...v1.6.1)_

## v1.6.0

- Add an option to restrict the extent of central heatmaps to the upper-right or lower-left corner to enable comparison of two heatmaps in the center. Run `npm start` and see [http://localhost:8080/apis/svg.html?/viewconfs/diagonal-split-heatmap.json](http://localhost:8080/apis/svg.html?/viewconfs/diagonal-split-heatmap.json) for an example
- Updated `pixi.js` to version `5`. In your `html` files you need to replace the previous PixiJS loader with `<script crossorigin src="https://unpkg.com/pixi.js@5/dist/pixi.min.js"></script>` (or `<script crossorigin src="https://unpkg.com/pixi.js-legacy@5/dist/pixi-legacy.min.js"></script>` if you want to use the Canvas renderer)
- Add a dialog to directly edit the view config in the browser
- Replace ReactBootstrap modal with custom modal to not rely on Bootstrap and support Jupyter
- Updated `pub-sub-es` to version `1.2.1` to fix a bug in the shorthand event unsubscription
- Added an example of a map overlay
- Support semi-transparent colormaps through RGBA colors
- Update Mapbox endpoint. See [http://localhost:8080/others/mapbox.html](http://localhost:8080/others/mapbox.html) for an example.
- Improve performance of the `mousemove`-related event handling
- Remove unused properties from the exported view config
- Improve performance of tiles fetching through a combination of throttling and debouncing
- Fix a minor visual glitch with the positioning of track-related `div`s
- Fix OSM track to avoid CORS issues in Chrome and allow setting `minPos` to `0`
- Fix #648: Auto select and copy URL when exporting a view by link
- Fix #647: Shows correct URL when specifying an absolute URL as `exportViewUrl` in the viewconf
- Fix #651: set correct namespace for SVG exports
- Fix #593: zoom to data extent when adding the first track to an empty view

_[Detailed changes since v1.5.8](https://github.com/higlass/higlass/compare/v1.5.8...v1.6.0)_

## v1.5.8

- Fix a value scale syncing bug
- Update the docs

_[Detailed changes since v1.5.7](https://github.com/higlass/higlass/compare/v1.5.7...v1.5.8)_

## v1.5.7

- Fix #637 - SVG export fill color doesn't match what is selected
- Switch to nearest neighbor interpolation for horizontal heatmaps

_[Detailed changes since v1.5.8](https://github.com/higlass/higlass/compare/v1.5.6...v1.5.7)_

## v1.5.6

- Allow any horizontal track to also be placed on the left or right

_[Detailed changes since v1.5.8](https://github.com/higlass/higlass/compare/v1.5.6...v1.5.7)_

## v1.5.5

- Fixed #612: resolved an issue with caseinsensitive chromosome names
- Destroy heatmap sprites and axis texts to mitigate memory leak

_[Detailed changes since v1.5.4](https://github.com/higlass/higlass/compare/v1.5.4...v1.5.5)_

## v1.5.4

- Fix the multiple component passive event issue by replacing the dom-event.js handlers with a class so that each component maintains its own context

_[Detailed changes since v1.5.3](https://github.com/higlass/higlass/compare/v1.5.3...v1.5.4)_

## v1.5.3

- Let HorizontalLineTracks look up tileset_info.tile_size
  and tileset_info.bins_per_dimension
- Specify default track types directly in `showAvailableTrackTypes` API
- Updated the docs deploy directory
- Updated the javascript API example to include a full working html page
- Use default height for new tracks rather than min height. Fixes
  newly added gene annotations so that they show names without having
  to be resized
- Fixed bug that was causing overlay tracks to not appear
- Fixed horizontal-vector-heatmap error thrown bug by padding incomplete
  incoming data arrays

_[Detailed changes since v1.5.1](https://github.com/higlass/higlass/compare/v1.5.1...v1.5.3)_

## v1.5.1

- Fixed UI hanging on mouseover of zoomed out matrix bug
- Fixed #588: horizontal heatmap zoom limit bug
- Reset value scale locks when new viewconf is added
- Added a default track type for the chromsizes datatype
- Fixed drag handler pubSub reference
- Fixed #596: scrolling while zooming bug introduced in latest chrome

_[Detailed changes since v1.5.0](https://github.com/higlass/higlass/compare/v1.5.0...v1.5.1)_

## v1.5.0

- Allow sharing the mouse position globally. See [`docs/examples/others/global-mouse-position.html`](docs/examples/others/global-mouse-position.html) for an example.
- Allow disabling the change of views and tracks separately by setting `viewEditable: false` and `tracksEditable: false` in your view config.
- Added ability to define label margins. See [`docs/examples/viewconfs/label-margin.json`](docs/examples/viewconfs/label-margin.json) for an example.
- Make view spacing adjustable via initialization options. See [/docs/examples/others/adjust-view-spacing.html](/docs/examples/others/adjust-view-spacing.html) for an example.
- Add a new option to tracks that support axis: `axisMargin` to add some margin to an axis. See [docs/examples/viewconfs/axis-margin.json](docs/examples/viewconfs/axis-margin.json) for an example
- Add a new option to BarTrack for drawing a demarcation line at the bottom of the track, i.e., at the zero value. See [`/apis/svg.html?/viewconfs/bar-zero-line.json`](/apis/svg.html?/viewconfs/bar-zero-line.json) for an example.
- Fixed an issue with small offsets when exporting bar tracks to SVG
- Fixed an issue where bars in a `BarTrack` related to values higher than `valueScaleMax` were not drawn.
- Fixed an issue with `hgApi.setTrackValueScaleLimits`
- Fix #291: allow web page scrolling when zoomFixed is set to true
- Fix #578: BarTrack SVG export overplotting error.
- Fix #584: Reset viewport is broken

_[Detailed changes since v1.4.2](https://github.com/higlass/higlass/compare/v1.4.2...v1.5.0)_

## v1.4.2

- Fix #568, #569

## v1.4.1

- Allow users to choose adding the chromosome grid overlay from the Add Track Dialog when selecting a cooler file.
- Expose version from hglib. E.g., `window.hglib.version`

## v1.4.0

- Add `constIndicators` as an option to 1D tracks for displaying a visual indicator (e.g., a line) at a constant value.
- Added `[glyph-color]` as the default option for line and bar tracks
- Add new public event `cursorLocation`. See [`docs/examples/apis/cursor-location.html`](docs/examples/apis/cursor-location.html) for an example.
- Extend `mouseMoveZoom` event to support 1D data tracks.
- Expose D3 libraries to plugin tracks
- Overlay tracks now properly allow for extent to include multiple ranges.
- Overlay tracks can now optionally have extent ranges configured as a 4-tuple, separating x ranges from y ranges

## v1.3.1

- Clear mouse position indicator when leaving the root dom element, on blurring the window, and when no track is hovered

## v1.3.0

- Changed `defaultOptions` to `defaultTrackOptions` in the hglib.viewer options.
- Added `TiledPixiTrack.on` event handler to listen to data changes
- Added several API endpoints: `getComponent()`, `setAuthHeader()`, `getAuthHeader()`,
- Added export of several utility functions: `waitForJsonComplete()`, `waitForTilesLoaded()`, `waitForTransitionsFinished()`, `mountHGComponent()`, `getTrackObjectFromHGC()`
- Added the ability to specify default track options through the API
- Added nesting to the tileset finder so that tilesets can be grouped together into categories
- Added the `axisLabelFormatting` option to 1d quantitative tracks
- Added TiledPixiTrack.on event handler
- Added getTrackObject to exports
- Added support for overlay tracks
- Minor bug fix wherein valueScaleMin and valueScaleMax weren't used when set to 0
- Added support for click event handling of 1D and 2D annotations from `1d-annotation` and `chromosome-2d-annotations` tracks
- Cloned views split vertically first (#259)
- Change component height when a new viewconf is passed in
- Add a fudge factor to ensure that the entire view is shown in the grid layout
- Refactored the pub-sub service to avoid implicit global event listening
- Fix a minor visual glitch in the gene annotation track
- Expose `mix()` from `mixwith` to plugin tracks
- Support different aggregation modes (mean, min, max, std) for bigWig files
- Changed `defaultOptions` to `defaultTrackOptions` in the hglib.viewer options.
- Clear mouse position indicator when leaving the root dom element, on blurring the window, and when no track is hovered
- Fix several issue with SVG export
- Minor bug fix wherein valueScaleMin and valueScaleMax weren't used when set to 0
- Fix #401
- Fix #395
- Fix #360
- Support different aggregation modes (mean, min, max, std) for bigWig files

## v1.2.8

- Added `editable` as a possible option to hglib.viewer()
- Enabled arbitrary tile resolution in HeatmapTiledPixiTrack. It just needs to receive `bins_per_dimension` in the tileset info. Otherwise it defaults to 256.

## v1.2.6

- Fixed trackSourceServer export
- Fixed BedLikeTrack errors being thrown

## v1.2.5

- Fix remote viewConf loading in HiGlassComponent

## v1.2.4

- Fix #322
- Fix missing update of the value scale upon rerendering
- Fix absToChr and chrToAbs of the ChromInfo API
- Fixed a nasty rendering bug in the chrom labels track

## v1.2.3

- Fixed line inversion issue (#268)
- Fixed fetched area size mismatch issue on mouseover
- Added mouseover text to UI elements
- Upgraded to webpack 4
- Started building hglib.js and hglib.min.js
- Support for searching for gene names with dashes
- Sort tilesets alphabetically (#256)
- Fixed zoom linking issues (#251, #76)

## v1.2.1 and v1.2.2

- Accidental releases. Please ignore.

## v1.2.0

- Add 1D heatmap track (#303): Alternative visual representation of 1D bigwig tracks. See https://github.com/higlass/higlass/pull/303 and https://github.com/higlass/higlass/blob/develop/docs/examples/1d-heatmap-track.html for an example.

![1D Heatmap Track](https://user-images.githubusercontent.com/932103/43858298-a7463ece-9b1b-11e8-9da4-a6fccdde2406.png '1D Heatmap Track')

- Add fixing y-scale of 1D data tracks (#297). See https://github.com/higlass/higlass/pull/297 and https://github.com/higlass/higlass/blob/develop/docs/examples/api-set-track-value-scale-limits.html for an example.
- Add JS-API for resetting the viewport back to the initial x and y domains in the viewconfig (#289)
- Add JS-API for adjusting the margin of the HiGlass instance (#286). See https://github.com/higlass/higlass/pull/286 for an example.
- Add JS-API for getting the min and max value of a track (#298). See https://github.com/higlass/higlass/blob/develop/docs/examples/api-get-min-max-value.html for an example.
- Enhance bed track (#278): support value encoding as the `y` offset or `color`. See https://github.com/higlass/higlass/pull/278 for an example.
- Enhance gene annotation track (#314): See https://github.com/higlass/higlass/pull/314 and https://github.com/higlass/higlass/blob/develop/docs/examples/gene-annotations.html for an example.

![Enhanced Gene Annotation Track](https://user-images.githubusercontent.com/932103/44225400-70b7f500-a15b-11e8-9656-d2ba161bccf7.png 'Enhanced Gene Annotation Track')

- Enhance chrom label track (#305): add support for adjusting the font size, font alignment, and font outline to use space more economically. See https://github.com/higlass/higlass/pull/305 and https://github.com/higlass/higlass/blob/develop/docs/examples/chromosome-labels.html for an example.

![Enhanced Chrom Label Track](https://user-images.githubusercontent.com/932103/43924834-9baaf4c8-9bf3-11e8-8167-1ce1dce70849.png 'Enhanced Chrom Label Track')

- Enhance bar track (#304): add color and gradient encoding plus diverging tracks. See https://github.com/higlass/higlass/pull/304 and https://github.com/higlass/higlass/blob/develop/docs/examples/bar-track-color-range.html for an example.

![Enhanced Bar Track](https://user-images.githubusercontent.com/932103/43865156-c00aa53a-9b2f-11e8-9213-bfd0af04f491.png 'Enhanced Bar Track')

- Expose `absToChr` and `chrToAbs` API on `ChromInfo` (#283 and #307)
- Upgrade to React `v16.5`
- Removed numjs (#320)
- Update tool tip appearance (#309)
- Make resize handle fade out and in upon mouse enter of a draggable div
- Enlarge resize handle upon mouse enter
- Remove all tracks from the 'whole' window when clearing the view
- Fix viewport projection issue when there are vertical and horizontal rules
- Fix colorbar positioning bug
- Fix #317 (moving gene positions)
- Fix #263
- Fix #245: track type selection bug
- Fix #262: zoom to data extent issue

## v1.1.5

- Merge'd Chuck's PR for adding 'same-origin' to fetch request headers
- Fixed a bug where a view without a layout is created with a width of 1

## v1.1.4

- Fix the checkAllTilesetInfoReceived function so that it ignores left and top
  axis tracks
- First release to be registered with Zenodo

## v1.1.3

- Add z-index to mouseover div so that it's not hidden behind other elements

## v1.1.2

- Inline the SVG styles so they aren't overwritten by other elments on the
  page
- Inline TrackControl svg styles so they aren't overwritten by page css
  settings
- Clear gene annotation graphics before redrawing

## v1.1.1

- Fixed export track data bug in heatmaps that are not combined tracks

## v1.1.0

- Check whether the tileset_info specifies that the tiles should be mirrored
- Added data export feature
- Added showMousePosition and showMouseTooltip to horizontal-bar-track

## v1.0.4

- Zoom through the viewport projection

## v1.0.3

- Fixed cross rule bug

## v1.0.2

- Added vertical divergent bar tracks
- Fixed export in SVG
- Fix mouseover error when trackrenderer hasn't been initialized yet
- Added zoomFixed option to the top level of the viewconf
- Use transpiled version of `mixwith.js`
- Add options to change the background of the label and colorbar

## v1.0.1 (2018-06-14)

- Fixed background export in SVG
- Turned off line mouseover by default

## v1.0.0-alpha.12

- Fixed long loading bug on zoomed in genes

## v1.0.0-alpha.11

- Fixed gene stretching issues

## v1.0.0-alpha.10

- Fixed background rendering after resizing
- Fixed viewconf export link (use state.viewconf vs props.viewconf)

## v1.0.0-alpha.9

- Fixed lock value scales

## v1.0.0-alpha.8

- Fixed tooltip scrollbar appearance
- Fixed context menu appearing issue

## v1.0.0-alpha.7

- Fixed scrolling bug when multiple higlass components are on a single page
- Fixed hover bug in combined tracks

## v1.0.0-alpha

- Added triangles to genes
- Preliminary authentication support
- Added track for displaying gigapixel images
- Added GeoJSON track and updated OSM track
- Added mouseMoveZoom event to public API
- Fixed and extended pubSub module
- Added flexible per-track crosshair
- Fixed and robustified range selection API
- Display error message on error
- Don't error when displaying menus when invalid track type is
  entered
- Added an endpoint for sharing view configs as a link (`shareViewConfigAsLink()`) and exporting them as png and svg (`get('png' || 'svg')`)
- Simplified `hglib` API
- Updated third-party libs to get rid of deprecation warnings for React v16
- Fixed small bug in placing rules
- Display error when failing to retrieve tilesetInfo

* Added support for cross-section tracks

- Rendering improvements

## v0.10.22 (2018-02-22)

- Added options to change the fill color of bedlike tracks

## v0.10.21 (2018-02-21)

- Exposed the ChromosomeInfo structure as part of the hglib API

## v0.10.20 (2018-02-??

- Rendering improvements

## v0.10.20 (2018-02-20)

- Fixed api variable in HiGlassComponent
- Fixed relToAbsChromPos so that it converts locations to numbers before
  adding
- Added strokeWidth as an option to the viewport projection track

## v0.10.19 (2018-02-11)

- Fixed the 2D chromosome labels track

## v0.10.18 (2018-02-11)

- Fixed Horizontal2DTilesTrack

## v0.10.16 (2018-

- Don't show the "Strange tileData" warnings
- Pegged bootstrap to version 3.3.7

## v0.10.16 (2018-02-01)

- Fixed a bug during active range selection when the _select_ mouse tool is deactivated

## v0.10.15 (2018-01-30)

- Added the vertical bed-like track

## v0.10.13 (2018-01-25)

- Added the multivec track

## v0.10.12 (2018-01-21)

- Fixed pseudocounts in linear-scaled heatmaps

## v0.10.12 (2018-01-20)

- Fixed get scale bug

## v0.10.11 (2018-01-17)

- Fixed non-draggable views bug

## v0.10.10 (2018-01-17)

- Default to log scaling if there are negative values
- Fixed the custom colormap
- Fix the gene annotations color changing
- Fixed two regressions regarding the viewport projections

## v0.10.9 (2018-01-13)

- Skipping a version because the latest version wasn't specified in
  package.json

## v0.10.8

- Skipping a version because the latest version wasn't specified in
  package.json

## v0.10.7 (2018-01-13)

- Show current data resolution in tiled sets containing raw resolutions rather
  than zoom levels

## v0.10.6 (2017-12-28)

- Load ResizeSensors after the element is attached to the DOM tree
- Added DivergentBarTrack
- Fixed submenu hiding bug

## v0.10.5 (2017-12-27)

- Fixed bug in TrackRenderer.setUpInitialScales where updating the view with
  new equivalent initial domains and different dimensions led to the view being
  misplaced
- Added z-index to popup menus

## v0.10.4 (2017-12-16)

- Fixed a bug in zoomToData
- New API call for setViewConfig
- New API call for zoomToDataExtent

## v0.10.3 (2017-12-13)

- Don't include a colon if the port is 80
- Added an option to clear the view
- Exclude NaN values when setting the valueScale
- Fixed bug related to displaying empty matrix tiles

## v0.10.2 (2017-12-12)

- Fixed a bug in loading tileset info that isn't there
- Better error handling on internal server error
- Removed functionless menu item

## v0.10.1 (2017-12-05)

- Fixed bug in Bedlike tracks that don't have a header

## v0.10.0 (2017-12-05)

- Change track type from the config menu
- Initial framework for divided by tracks
- Y-positioned bed-like tracks

## v0.9.16 (2017-

- Fixed undefined error when toggling genome position search box

## v0.9.15 (2017-11-22)

- Fixed bug where newly selected annotations weren't being used
- Added the hideHeader option
- Added a warning for malformed gene annotations
- Free up webgl renderer resources when unmount
- Minor CSS cleanup
- Fix resizing bug that appears after closing a view
- Warn if there are no track source servers specified in the viewconf

## v0.9.14 (2017-11-11)

- Show labels on bar chart

## v0.9.13 (2017-11-09)

- Fixed gene position searching regression

## v0.9.12 (2017-11-08)

- Fix inter-chromosomal searches (chr1-chr2)

## v0.9.11 (2017-11-08)

- Fix gene annotation coloring bug
- Fix menu clash error that occurs when a center track is specified
  without a combined track
- Zoom into entire chromosomes by just entering its name

## v0.9.10 (2017-11-01)

- Fixed d3 brush Error: <rect> attribute height: Expected length, "Infinity"
- Fixed scale initialization error
- Added back heatmap value scaling
- Fixed horizontal heatmap multires tile loading
- Better point export

## v0.9.9 (2017-11-01)

- Fix SVG bar chart export
- Fixed network error on SVG export again (from v0.8.44)

## v0.9.8 (2017-10-31)

- Switch back to minified build

## v0.9.7 (2017-10-31)

- Initialize scales when viewconfig is loaded rather than on
  handleScalesChanged

## v0.9.6 (2017-10-31)

- Faulty build (package.json wasn't there)

## v0.9.5 (2017-10-31)

- Fix visual clash of the center track's context menu and the colormap
- Make visualization of 2D annotations more flexible: stroke width and fill / stroke opacity can be changed
- Create debug output files

## v0.9.4 (2017-10-26)

- Reintroduced value scale serialization fix
- Fixed HorizontalHeatmapExport
- Added a minimum width to 2D annotations
- Added SVG export for 2d-rectangle-domains track

## v0.9.3 (2017-10-23)

- Removed console log statement

## v0.9.2 (2017-10-23)

- Fixed the build script to copy hglib.css rather than style.css

## v0.9.1 (2017-10-23)

- Add support for vertical bar tracks
- Fixed .travis.yml release issue

## v0.9.0 (2017-10-21)

- Add 1D and 2D range selection
- Add support for SASS
- Add support for CSS Modules
- Update visuals of the context menu and view header
- Integrate search bar into view header
- Add ESLint and adhere to consistent code style
- (Fix #135) - Colorbar moves with the track when it's being resized
- (Fix #126) - Gene annotations shouldn't overlap on vertical tracks anymore
- Keep track controls visible if config menu is active
- Show child menus above the parent if there isn't enough space on the bottom
- Add port number when exporting viewconfs from a non-standard port
- Support arbitrary resolutions in heatmaps

## v0.8.44

- Redraw TiledPixiTracks after the tileset info has been received
- Remove value scale locks on handleCloseTrack
- Check that tiledPlot is defined in createSVG to fix the export
  failing when there's two side-by-side by views created after closing
  one
- Fixed the "Failed: network error" issue in chrome by changing the
  "download" function in utils.js

## v0.8.43

- More fixes for SVG output for bedlike tracks

## v0.8.42

- Fixed SVG output for bedlike tracks

## v0.8.41

- Fixed chromosome grid color bug
- Fixed chromosome grid loading with many values bug

## v0.8.40

- Fixed value scale locking bug

## v0.8.37

- Fixed center track label background oddness (#144)

## v0.8.36

- (fix #146) Fixed value scale locking serialization bug
- Fixed gene annotation SVG export
- Fixed chromosome ticks SVG export

## v0.8.35

- Fixed colorbar hiding bug (Issue #131)

## v0.8.34

- Fixed horizontal heatmap loading after the adjustable color scale changes
- Fixed vertical heatmap loading
- Fixed vertical heatmap colorscale brush in LeftTrackModifier

## v0.8.33

- Removed the outside colorbar labels option (it's a little
  ambiguous on the right side since the labels will be adjacent
  to the other axis elements.

## v0.8.32

- Removed tests from package.json so that build completes (tests fail on
  travis for some reason)

## v0.8.31

- Add a color limit selection to the Heatmap track in HiGlass

## v0.8.30

- Cherry picked the BedLikeTrack from the circle branch

## v0.8.28

- Fixed dependencies (peer and normal)
- Fixed other minor issues with `package.json`

## v0.8.27

- Fixed bug wher the "Loading" sign remained with 1D point tracks

## v0.8.26

- Different mapbox style options

## v0.8.25

- Hidden OSM tiles
- Customizeable osm width

## v0.8.24

- Major performance improvements for Gene annotations and horizontal points
- Fixed bug in searching for genome positions with a space at one of the ends
- Added the OSM tiles

## v0.8.23

- Don't show chromosome sizes as a separate track

## v0.8.22 - 2017-07-13

- Safari add track bug fix
- Backwards compatibility on selectable chromosome axis tracks

## v0.8.21 - 2017-07-10

- Fixed the default transformation for horizontal tracks

## v0.8.20 - 2017-07-10

- Fix label display

## v0.8.19 - 2017-07-10

- Added the ability to select different transformations

## v0.8.18 - 2017-06-29

- Fixed custom colormap picker
- Fixed overlayed track addition on double click

## v0.8.17 - 2017-06-28

- Performance improvements

## v0.8.16 - 2017-06-27

- Fixed a regression where closing views didn't remove the associated PIXI
  Components
- Increased the drag timeout time to 5 seconds

## v0.8.15 - 2017-06-26

- Lowered the maximum number of tiles retrieved at once to 20

## v0.8.14 - 2017-06-26

- Increase the maximum number of tiles retrieved at once to 40

## v0.8.13 - 2017-06-26

- Option to draw borders around tracks
- Option to change the stroke, fill colors and opacity of the
  horizontal-2d-rectangle-domains track

## v0.8.12 - 2017-06-26

- Hide overflow track handles

## v0.8.11 - 2017-06-26

- Fixed double click track addition bug
- Mask view boundaries so that when the tracks are too large
  to fit inside, they don't overflow outside of their view
- Added favicon

## v0.8.10 - 2017-06-25

- Multiple tileset selection
- Disabled zooming on scrolling fix

## v0.8.9

- Make sure that the zoomable div matches the size of the container

## v0.8.8 - 2017-06-20

- Don't start zooming when scrolling into a HGC

## v0.8.7 - 2017-06-18

- Decreased the maximum colorbar height
- Made the draggable div handles more transparent
- Lowered the minimum height for chromosome axes

## v0.8.6 - 2017-06-18

- Fixed a bug where the HG Component would automatically and indefinitely
  increase in size

## v0.8.5 - 2017-06-16

- Fixed view linking bug (regression)
- Added horizontal and vertical 2D domains tracks

## v0.8.4 - 2017-06-12

- Include a limit in the tilesets query so that all results are returned

## v0.8.3 - 2017-06-06

- Fixed a regression where adding new tracks doesn't work

## v0.8.2 - 2017-06-01

- Move hglib.css to dist/styles rather than dist/

## v0.8.1 - 2017-06-01

- Changed package.json to create hglib.css rather than style.css

## v0.8.0 - 2017-06-01

- Switched to webpack 2
- Various warning fixes in the code
- Pull chromsizes from the tilesets table instead
- Remove the chroms table and app

## v0.7.3 - 2017-05-23

- Added stroke width as a property of line tracks
- Fixed view layout bug caused by the "i" member of the layout not
  matching the view's uid
- Fixed resizing so that vertical changes get handled immediately

## v0.7.2

- Added purple and turquoise colors
- Added an option to control the label opacity

## v0.7.1

- Added horizontal and vertical track viewport projections
- Bug fix where assembly name gets removed from track label

## v0.7.0

- Added an assembly selector to the GenomePositionSearchBox
- Prefix track names with their assembly

## v0.6.9

- Lower the default resolution of lines for performance reasons
- Added outsideLeft, outsideRight, outsideTop and outsideBottom
  as available axis positions

## v0.6.8

- Component sizes are adjsuted on component load
- Genome position search box styling is set to not
  have a bottom margin

## v0.6.7

- Unbounded functionality to increase the size of the layout if new tracks are
  added which increase its size
- Configurable track label background opacity
- Fixed: vertical colorbar label mirroring

## v0.6.6

- Bug fix: closing a track which had a value scale lock with another track now
  works

## v0.6.5

- Bug fix: tracks rendered with locked scale, rather than just the colorbar
- Bug fix: locked line scales
- Bug fix: assorted other track locking, scale and colorbar bugs

## v0.6.4

- Added value scale locking
- Fixed bug where newly added heatmaps didn't render (syncTrackObjects needs
  to call applyZoomTransform)
- Fixed bug where new chromosome axis didn't appear after being added - Had to call animate after the chromosome info was received

## v0.6.3

- Added colorbar for Heatmaps
- Draw scales on the outside of the linear tracks
- Added the SquareMarkerTrack

## v0.6.2

- Scale tracks from minimum to maximum value, rather than starting at 0

## v0.6.1

- Fixed a minor issue with chromosome labels not being exported

## v0.6.0

- Automatically draw the 2D grid after the data is loaded
- Add animated zoom transitions
- Add public BEDPE-like API to navigate to a given location
- SVG export
- Testing using Karma
- (Might have been in a different release) Default to interpolation-less rendering

## v0.5.16

- Fixed resizing bug

## v0.5.15

- Added mm9 chromosome labels
- Draw chromosome labels on reload
- Take name from track options

## v0.5.14

- Revert the initialXDomain changes Fritz introduced because they were causing
  issues with faithful reproduction of viewconfs
- Change 'tilesetInfo not loaded message' to 'loading...' until we either get
  an error or the tileset is loaded
- Omit certain fields from JSON export (HiGlassComponenent.getViewsAsString)

## v0.5.12

- Fixed export viewconfig link bug

## v0.5.11

- Added the fall colormap and made it the default

## v0.5.10

- Fix Chromosome2DAnnotations not being drawn by calling draw after the
  ChromosomeInfo is loaded
- Zoom to the currently visible data
- Use the minimum position to load data that is not located at the origin
- Viewconf downloads work on Firefox
- Alert when trying to project a viewport on the same view
- Resize handle positions fixed in Firefox
- Track config button icons fixed in Firefox
- Only redraw in timedUpdate if track positions have changed
- Fixed top and left axis not appearing bug
- Fixed chromosome horizontal labels not appearing
- Show minValue pixels by scaling from minValue to maxValue + minValue and
  adding minValue to each pixel
- Fix viewport projection error when new viewconfig is passed

## v0.5.9

- Labels outside of the bounds of a track
- Label colors

## v0.5.8

- A host of performance improvements

## v0.5.7

- Empty accidental release

## v0.5.6

- Add log scaling to line tracks
- Add colors to line tracks
- Add width option to 2D grid
- Add color option to 2D grid

## v0.5.5

- Add per-view `zoomFixed` settings
- Added configurable viewport projection colors (projectionFillColor,
  projectionStrokeColor)
- Added an empty .npmignore to prevent it from excluding the dist/
  directory specified in the .gitignore
- Enhance 2D annotations by supporting RGBA, fill and stroke-dependent coloring,
  and locus-wise min width / height definitions
- Remove builds. Use NPM

## v0.5.4

- Fixed bug related to the selection of the plot type
- Update existing tracks before adding new ones in syncTrackObjects
- Removed the "Move up" menu item
- Deep copy incoming viewconfs so that changing them outside of the component
  leads to an update
- Added onLocationChanged event listener

## v0.5.3

- Forgot to bump the version number in 0.5.2

## v0.5.2

- Don't draw data that extends beyond the end of the assembly
- Fixed bug where data was being hidden in empty (all 0) tiles - Changed minVisibleValue and maxVisibleValue in TiledPixiTrack
- Label the horizontal and vertical line tracks by default

## v0.5.1

- Configurable gene annotation colors
- Added chromosome annotations tracks for programmatically addeable
  annotations
- Fixed the 'Cannot read property 0 of undefined' bug when tileset info is
  inaccessible
- Remove track resize handles when the component isn't editable
- Fix bug associated with setting a new initial[X/Y]Domain where the
  cumulativeCenterOffset wasn't being reset
- Bug fix where if a view doesn't have a uid we should assign it one

## v0.5.0

- Default to 12 columns
- Display a warning if tileset info isn't found
- Use 16bit floats for heatmap data

## v0.4.40

- Remove default colormap from viewconfig

## v0.4.39

- Switch cog and close buttons

## v0.4.33

- New header colors

## v0.4.32

- Reduced the number of tiles requested by the horizontal heatmap track
- Removed console log statements

## v0.4.31

- Fixed regression and compatibility change with new zoom and location locking
- Fixed regression in the selection dragging

## v0.4.30

- Added a minimum width to left-axis so that it doesn't only show the last two
  digits by default

* Added horizontal and vertical heatmaps

- Styling changes for the Configure track controls
- Fixed the bug with AddTrackMenu cancel button turning black by properly
  increasing the number of visible tilesets in TilesetFinder
- Added options to allow flipping horizontal and vertical charts
- Fixed NaN prefix bug
- Fixed invalid negative value attributes for <rect> bug

## v0.4.29

- Moved default heatmap information to lower right hand corner
- Fixed a bug which distorted the view when initialized with an initial X
  scale and Y scale
- Added white to red, white to green and white to blue scales
- Added axes for the 1D tracks
- Took the ID out of the view header
- Added a white border behind the track controls

## v0.4.28

- Fixed critical regression where track replacement wasn't working because
  newly created tracks didn't have their options set
- Fixed a regression where track movement wasn't working because TiledPlot
  wasn't being updated
- Increase the size of the tileset selector

## v0.4.27

- Changed config.js Chromosome Labels to Chromosome Axis
- Fixed default option setting so that it doesn't override provided options
- Adding zoom limit option to heatmap
- Add current resolution to the track label
- Fixed regression caused by "Fast redraw by tiling commit"
- Hitting enter in the genome position search box initiates a search

## v0.4.26

- Fixed close button

## v0.4.25

- Fractional zoom lock
- Faster config menu loading
- Faster track addition by limiting the udpates of TiledPlot (using
  shouldComponentUpdate)

## v0.4.21

- Chromosome grid positions start at position 1
- Export link includes 'app'

## v0.4.20

- Changed tile API location to use included server value rather than
  prepending '//'

## v0.4.19

- Removed dist directory from .gitignore

## v0.4.18

- Use production react in the build
- Added dist to .gitignore

## v0.4.17

- Updated default view config
- Wider ticks

## v0.4.16

- Fritz's public API

## v0.4.15

- Fritz's lazy animation
- Fritz's public API
- Minimum height for tracks can be specified in track type definition in
  config.js
- New chromosome 2D grid (for hg19)
- New chromosome 1D axis (for hg19)
- New chromosome horizontal axis (for hg19)
