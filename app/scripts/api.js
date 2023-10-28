// @ts-nocheck
import ReactDOM from 'react-dom';
import createPubSub from 'pub-sub-es';
import Ajv from 'ajv';

import schema from '../schema.json';

import { setTileProxyAuthHeader } from './services';

import { getTrackObjectFromHGC } from './utils';

import { MOUSE_TOOL_MOVE, MOUSE_TOOL_SELECT } from './configs';

import { version } from '../../package.json';

const forceUpdate = (self) => {
  self.setState(self.state);
};

const createApi = function api(context, pubSub) {
  /** @type {import('./HiGlassComponent').default} */
  const self = context;

  let pubSubs = [];

  const apiPubSub = createPubSub();

  const destroy = () => {
    pubSubs.forEach((subscription) => pubSub.unsubscribe(subscription));
    pubSubs = [];
  };

  // Internal API
  return {
    destroy,
    publish: apiPubSub.publish,
    // Stack: mapping of callback names to arrays of callbacks, useful
    // to determine how many callbacks exist for a particular event.
    stack: apiPubSub.stack,
    // Public API
    public: {
      /**
       * HiGlass version
       * @return {string} Version number
       */
      get version() {
        return version;
      },

      /**
       * Enable or disable broadcasting the mouse position globally
       * @param {boolean} isBroadcastMousePositionGlobally - If `true` the mouse
       *   position will be broadcasted globally.
       */
      setBroadcastMousePositionGlobally(
        isBroadcastMousePositionGlobally = false,
      ) {
        self.setBroadcastMousePositionGlobally(
          isBroadcastMousePositionGlobally,
        );
      },

      /**
       * Enable or disable showing the global mouse position
       * @param {boolean} isShowGlobalMousePosition - If `true` the global mouse
       *   position will be shown for any track that has
       *   `options.showMousePosition = true`.
       */
      setShowGlobalMousePosition(isShowGlobalMousePosition = false) {
        self.setShowGlobalMousePosition(isShowGlobalMousePosition);
      },

      /**
       * Convenience function to enable / disable the global mouse position
       * @description This function is equivalent to calling
       *   `setBroadcastMousePositionGlobally()` and
       *   `setShowGlobalMousePosition()`.
       * @param {boolean} isGlobalMousePosition - If `true` the global mouse
       *   position will be shown and broadcasted.
       */
      setGlobalMousePosition(isGlobalMousePosition = false) {
        self.setBroadcastMousePositionGlobally(isGlobalMousePosition);
        self.setShowGlobalMousePosition(isGlobalMousePosition);
      },

      /**
       * Set an auth header to be included with all tile requests.
       *
       * @param {string} newHeader The contensts of the header to be included.
       * Example: ``hgapi.setAuthHeader('JWT xyz')``
       */
      setAuthHeader(newHeader) {
        setTileProxyAuthHeader(newHeader);

        // we need to re-request all the tiles
        self.reload();
      },

      /**
       * Get the currently set auth header
       */
      getAuthHeader() {
        return setTileProxyAuthHeader();
      },

      /**
       * Get a reference to the React HiGlassComponent
       *
       * @returns {HiGlassComponent}
       */
      getComponent() {
        return self;
      },

      /**
       * Reload all or specific tiles for viewId/trackId
       *
       * @param {array} target Should be an array of type
       *                       ({ viewId: string, trackId: string } | string).
       *                       If the array is just strings, it's interpreted
       *                       as a list of views whose tracks to reload.
       */
      reload(target) {
        /** @type {{ viewId: string, trackId: string}[]} */
        let tracks;
        if (!target) {
          tracks = self.iterateOverTracks();
        } else {
          tracks = target.flatMap((d) =>
            typeof d === 'string' ? self.iterateOverTracksInView(d) : d,
          );
        }

        for (const { viewId, trackId } of tracks) {
          const selectedTrack = self.getTrackObject(viewId, trackId);
          // iterate over childTracks if CombinedTrack
          for (const track of selectedTrack.childTracks || [selectedTrack]) {
            // reload tiles for tracks with tiles.
            if (track.fetchedTiles) {
              track.removeTiles(Object.keys(track.fetchedTiles));
              track.fetching.clear();
              track.refreshTiles();
            }
            // second argument forces re-render
            track.rerender(track.options, true);
          }
        }
      },

      /**
       * Destroy HiGlass instance
       */
      destroy() {
        destroy();
        ReactDOM.unmountComponentAtNode(self.topDiv.parentNode);
      },

      /**
       * Force integer range selections.
       *
       * @example
       *
       * hgv.activateTool('select'); // Activate select tool
       * hgv.setRangeSelectionToFloat(); // Allow float range selections
       */
      setRangeSelectionToInt() {
        self.setState({ rangeSelectionToInt: true });
      },

      /**
       * Force float range selections.
       *
       * @example
       *
       * hgv.activateTool('select'); // Activate select tool
       * hgv.setRangeSelectionToFloat(); // Allow float range selections
       */
      setRangeSelectionToFloat() {
        self.setState({ rangeSelectionToInt: false });
      },

      /**
       *
       *  The following enpoint restricts the size of range selection equally for 1D or
       *  2D tracks to a certain length (specified in absolute coordinates).
       *
       * @param {Number} [minSize = 0]  Minimum range selection.
       *   ``undefined`` unsets the value.
       * @param {Number} [maxSize = Infinity] Maximum range selection.
       *   ``undefined`` unsets the value.
       * @example
       *
       * hgv.activateTool('select'); // Activate select tool
       * hgv.setRangeSelection1dSize(5000, 10000); // Force selections to be between 5 and 10 Kb
       */
      setRangeSelection1dSize(minSize = 0, maxSize = Infinity) {
        self.setState({
          rangeSelection1dSize: [minSize, maxSize],
        });
      },

      /**
       * Set a new view config to define the layout and data
       * of this component
       *
       * @param {obj} newViewConfig A JSON object that defines
       *    the state of the HiGlassComponent
       * @param {boolean} resolveImmediately If true, the returned promise resolves immediately
       *    even if not all data has loaded. This should be set to true, if the new viewconf does not request new data. Default: false.
       * @example
       *
       * const p = hgv.setViewConfig(newViewConfig);
       * p.then(() => {
       *   // the initial set of tiles has been loaded
       * });
       *
       * @return {Promise} dataLoaded A promise that resolves when
       *   all of the data for this viewconfig is loaded. If `resolveImmediately` is set to true,
       * the promise resolves without waiting for the data to be loaded.
       */
      setViewConfig(newViewConfig, resolveImmediately = false) {
        const viewsByUid = self.processViewConfig(newViewConfig);
        const p = new Promise((resolve) => {
          this.requestsInFlight = 0;

          pubSubs.push(
            pubSub.subscribe('requestSent', () => {
              this.requestsInFlight += 1;
            }),
          );

          pubSubs.push(
            pubSub.subscribe('requestReceived', () => {
              this.requestsInFlight -= 1;

              if (this.requestsInFlight === 0) {
                resolve();
              }
            }),
          );

          self.setState(
            {
              viewConfig: newViewConfig,
              views: viewsByUid,
            },
            () => {
              if (resolveImmediately) {
                resolve();
              }
            },
          );
        });

        return p;
      },

      /**
       * Retrieve the visible viewconf.
       *
       * @returns (Object) A JSON object describing the visible views
       */
      getViewConfig() {
        return self.getViewsAsJson();
      },

      /**
       * Validate a viewconf.
       *
       * @returns (Boolean) A JSON object describing the visible views
       */
      validateViewConfig(viewConfig, { verbose = false } = {}) {
        const validate = new Ajv().compile(schema);
        const valid = validate(viewConfig);
        if (verbose && validate.errors) {
          console.warn(JSON.stringify(validate.errors, null, 2));
        }
        return valid;
      },

      /**
       * Get the minimum and maximum visible values for a given track.
       *
       * @param {string} viewId The id of the view containing the track.
       * @param {string} trackId The id of the track to query.
       * @param {bool} [ignoreOffScreenValues=false] If ``true`` only truly visible values
       *  are considered. Otherwise the values of visible tiles are used. Not that
       *  considering only the truly visible
       *  values results in a roughly 10x slowdown (from 0.1 to 1 millisecond).
       * @param {bool} [ignoreFixedScale=false]  If ``true`` potentially fixed scaled values are
       *  ignored. I.e., if the
       *  absolute range is ``[1, 18]`` but you have fixed the output range to
       *  ``[4, 5]`` you would normally retrieve ``[4, 5]``. Having this option set to
       *  ``true`` retrieves the absolute ``[1, 18]`` range.
       * @example
       * const [minVal, maxVal] = hgv.getMinMaxValue('myView', 'myTrack');
       * @returns {Array} The minimum and maximum value
       */
      getMinMaxValue(
        viewId,
        trackId,
        ignoreOffScreenValues = false,
        ignoreFixedScale = false,
      ) {
        return self.getMinMaxValue(
          viewId,
          trackId,
          ignoreOffScreenValues,
          ignoreFixedScale,
        );
      },

      /**
       * Generate a sharable link to the current view config. The `url` parameter should contain
       * the API endpoint used to export the view link (e.g. 'http://localhost:8989/api/v1/viewconfs').
       * If it is not provided, the value is taken from the `exportViewUrl` value of the viewconf.
       *
       * @param {string}  url  Custom URL that should point to a higlass server's
       *   view config endpoint, i.e.,
       *   `http://my-higlass-server.com/api/v1/viewconfs/`.
       * @returns {Object}  Promise resolving to the link ID and URL.
       * @example
       * hgv.shareViewConfigAsLink('http://localhost:8989/api/v1/viewconfs')
       * .then((sharedViewConfig) => {
       *   const { id, url } = sharedViewConfig;
       *   console.log(`Shared view config (ID: ${id}) is available at ${url}`)
       * })
       * .catch((err) => { console.error('Something did not work. Sorry', err); })
       */
      shareViewConfigAsLink(url) {
        return self.handleExportViewsAsLink(url, true);
      },

      /**
       * Show overlays where this track can be positioned. This
       * function will take a track definition and display red,
       * blue or green overlays highlighting where the track can
       * be placed on the view. Blue indicates that a track can
       * be placed in that region, red that it can't and green that
       * the mouse is currently over the given region.
       *
       * @param {obj} track { server, tilesetUid, datatype }
       *
       * @example
       *
       *  let lineTrack = {
       *   "server": "http://higlass.io/api/v1",
       *   "tilesetUid": "WtBJUYawQzS9M2WVIIHnlA",
       *   "datatype": "multivec",
       *   "defaultTracks": ['horizontal-stacked-bar']
       * }
       *
       * window.hgApi.showAvailableTrackPositions(lineTrack);
       */
      showAvailableTrackPositions(track) {
        self.setState({
          draggingHappening: track,
        });
      },

      /**
       * Hide the overlay showing where a track can be positioned
       */
      hideAvailableTrackPositions() {
        self.setState({
          draggingHappening: null,
        });
      },

      /**
       * Show the track chooser which highlights tracks
       * when the mouse is over them.
       *
       * @param  {Function} callback (toViewUid, toTrackUid) =>: A function
       *                             to be called when a track is chosen.
       * @return {[type]}            [description]
       */
      showTrackChooser(callback) {
        self.setState({
          chooseTrackHandler: (...args) => {
            self.setState({
              chooseTrackHandler: null,
            });

            callback(...args);
          },
        });
      },

      /**
       * Hide the track chooser.
       */
      hideTrackChooser() {
        this.setState({
          chooseTrackHandler: null,
        });
      },
      /**
       *
       * When comparing different 1D tracks it can be desirable to fix their y or value
       * scale
       *
       * @param {string} [viewId=''] The view identifier. If you only have one view this
       * parameter can be omitted.
       *
       * @param {string} [trackId=null] The track identifier.
       * @param [Number] [minValue=null] Minimum value used for scaling the track.
       * @param [Number] [maxValue=null] Maximum value used for scaling the track.
       *
       * @example
       *
       * hgv.setTrackValueScale(myView, myTrack, 0, 100); // Sets the scaling to [0, 100]
       * hgv.setTrackValueScale(myView, myTrack); // Unsets the fixed scaling, i.e., enables
       * dynamic scaling again.
       */
      setTrackValueScaleLimits(viewId, trackId, minValue, maxValue) {
        self.setTrackValueScaleLimits(viewId, trackId, minValue, maxValue);
      },

      /**
       * Choose a theme.
       * @deprecated since version 1.6.6. Use `setTheme()` instead.
       */
      setDarkTheme(darkTheme) {
        console.warn(
          '`setDarkTheme(true)` is deprecated. Please use `setTheme("dark")`.',
        );
        const theme = darkTheme ? 'dark' : 'light';
        self.setTheme(theme);
      },

      /**
       * Choose a theme.
       */
      setTheme(theme) {
        console.warn('Please note that theming is still in beta!');
        self.setTheme(theme);
      },

      /**
       * Change the current view port to a certain data location.
       * When ``animateTime`` is greater than 0, animate the transition.

       * If working with genomic data, a chromosome info file will need to be used in
       * order to calculate "data" coordinates from chromosome coordinates. "Data"
       * coordinates are simply the coordinates as if the chromosomes were placed next
       * to each other.
       *
       * @param {string} viewUid The identifier of the view to zoom
       * @param {Number} start1Abs The x start position
       * @param {Number} end1Abs The x end position
       * @param {Number} start2Abs (optional) The y start position. If not specified
       *    start1Abs will be used.
       * @param {Number} end2Abs (optional) The y end position. If not specified
       *    end1Abs will be used
       * @param {Number} animateTime The time to spend zooming to the specified location
       * @example
       *    // Absolute coordinates
       * hgApi.zoomTo('view1', 1000000, 1100000, 2000000, 2100000, 500);
       * // Chromosomal coordinates
       * hglib
       *   // Pass in the URL of your chrom sizes
       *   .ChromosomeInfo('//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv')
       *   // Now we can use the chromInfo object to convert
       *   .then((chromInfo) => {
       *     // Go to PTEN
       *     hgApi.zoomTo(
       *       viewConfig.views[0].uid,
       *       chromInfo.chrToAbs(['chr10', 89596071]),
       *       chromInfo.chrToAbs(['chr10', 89758810]),
       *       chromInfo.chrToAbs(['chr10', 89596071]),
       *       chromInfo.chrToAbs(['chr10', 89758810]),
       *       2500  // Animation time
       *     );
       *   });
       *   // Just in case, let us catch errors
       *   .catch(error => console.error('Oh boy...', error))
       * // Using getLocation() for coordinates
       * let firstViewLoc = hgApi.getLocation(oldViewUid);
       * hgApi.zoomTo(
       *  viewUid,
       *  firstViewLoc["xDomain"][0],
       *  firstViewLoc["xDomain"][1],
       *  firstViewLoc["yDomain"][0],
       *  firstViewLoc["yDomain"][1]
       * );
       */
      zoomTo(viewUid, start1Abs, end1Abs, start2Abs, end2Abs, animateTime = 0) {
        self.zoomTo(
          viewUid,
          start1Abs,
          end1Abs,
          start2Abs,
          end2Abs,
          animateTime,
        );
      },

      /**
       * Change the current view port to a location near the gene of interest.
       * When ``animateTime`` is greater than 0, animate the transition.
       *
       * @param {string} viewUid The identifier of the view to zoom
       * @param {string} geneName The name of gene symbol to search
       * @param {string} padding The padding (base pairs) around a given gene for the navigation
       * @param {Number} animateTime The time to spend zooming to the specified location
       * @example
       * // Zoom to the location near 'MYC'
       * hgApi.zoomToGene('view1', 'MYC', 100, 2000);
       */
      zoomToGene(viewUid, geneName, padding = 0, animateTime = 0) {
        self.zoomToGene(viewUid, geneName, padding, animateTime);
      },

      /**
       * Get the list of genes of top match for a given keyword.
       *
       * @param {string} viewUid The id of the view containing the track.
       * @param {string} keyword The substring of gene name to search.
       * @param {function} callback A function to be called upon gene list search.
       * @example
       * hgv.suggestGene('view1', 'MY', (suggestions) => {
       *    if(suggestions && suggestions.length > 0) {
       *      console.log('Gene suggested', suggestions[0].geneName);
       *      console.log('Chromosome', suggestions[0].chr);
       *      console.log('Start position', suggestions[0].txStart);
       *      console.log('End position', suggestions[0].txEnd);
       *    }
       * });
       */
      suggestGene(viewUid, keyword, callback) {
        return self.suggestGene(viewUid, keyword, callback);
      },

      /**
       * Zoom so that the entirety of all the datasets in a view
       * are visible.
       * The passed in ``viewUid`` should refer to a view which is present. If it
       * doesn't, an exception will be thrown. Note that if this function is invoked
       * directly after a HiGlass component is created, the information about the
       * visible tilesets will not have been retrieved from the server and
       * ``zoomToDataExtent`` will not work as expected. To ensure that the
       * visible data has been loaded from the server, use the ``setViewConfig``
       * function and place ``zoomToDataExtent`` in the promise resolution.
       *
       * @param {string} viewUid The view uid of the view to zoom
       * @example
       *
       * const p = hgv.setViewConfig(newViewConfig);
       * p.then(() => {
       *     hgv.zoomToDataExtent('viewUid');
       * });
       */
      zoomToDataExtent(viewUid) {
        self.handleZoomToData(viewUid);
      },

      /**
       * The endpoint allows you to reset the viewport to the initially defined X and Y
       * domains of your view config.
       *
       * @param {string} viewId The view identifier. If you have only one view you can
       * omit this parameter.
       *
       * @example
       *
       * hgv.resetViewport(); // Resets the first view
       */
      resetViewport(viewId) {
        self.resetViewport(viewId);
      },

      /**
       * Some tools needs conflicting mouse events such as mousedown or mousemove. To
       * avoid complicated triggers for certain actions HiGlass supports different mouse
       * tools for different interactions. The default mouse tool enables pan&zoom. The
       * only other mouse tool available right now is ``select``, which lets you brush
       * on to a track to select a range for annotating regions.
       *
       * @param {string} [mouseTool='']  Select a mouse tool to use. Currently there
       * only 'default' and 'select' are available.
       *
       * @example
       *
       * hgv.activateTool('select'); // Select tool is active
       * hgv.activateTool(); // Default pan&zoom tool is active
       */
      activateTool(tool) {
        switch (tool) {
          case 'select':
            self.setMouseTool(MOUSE_TOOL_SELECT);
            break;

          default:
            self.setMouseTool(MOUSE_TOOL_MOVE);
            break;
        }
      },

      /**
       * Get a Promise which returns a Blob containing a PNG for the current view.
       * It's possible to get string of the PNG bytes from that:
       *
       * @example
       * hgApi.exportAsPngBlobPromise().then(function(blob) {
       *   var reader = new FileReader();
       *   reader.addEventListener("loadend", function() {
       *     var array = new Uint8Array(reader.result.slice(0,8));
       *     console.log(array);
       *     console.log(new TextDecoder("iso-8859-2").decode(array));
       *   });
       *   reader.readAsArrayBuffer(blob);
       * });
       *
       * @returns {promise}
       */
      exportAsPngBlobPromise() {
        return self.createPNGBlobPromise();
      },

      /**
       * Get the current view as an SVG. Relies on all the tracks implementing
       * their respective exportAsSVG methods.
       *
       * @returns {string} An SVG string of the current view.
       */
      exportAsSvg() {
        return self.createSVGString();
      },

      /**
       * Export the current view as a Viewconf.
       *
       * @returns {string} A stringified version of the current viewconf
       */
      exportAsViewConfString() {
        return self.getViewsAsString();
      },

      /**
       * Get the current range selection
       *
       * @return {Array} The current range selection
       */
      getRangeSelection() {
        return self.rangeSelection;
      },

      /**
       * Get the current location for a view.
       *
       * @param {string} [viewId=null] The id of the view to get the location for
       * @returns {obj} A an object containing four arrays representing the domains and ranges of
       *  the x and y scales of the view.
       * @example
       *
       * const {xDomain, yDomain, xRange, yRange} = hgv.getLocation('viewId');
       */
      getLocation(viewId) {
        const wurstId = viewId
          ? self.xScales[viewId] && self.yScales[viewId] && viewId
          : Object.values(self.tiledPlots)[0] &&
            Object.values(self.tiledPlots)[0].props.uid;

        if (!wurstId) {
          return 'Please provide a valid view UUID sweetheart 😙';
        }

        return {
          xDomain: self.xScales[wurstId].domain(),
          yDomain: self.yScales[wurstId].domain(),
          xRange: self.xScales[wurstId].range(),
          yRange: self.yScales[wurstId].range(),
        };
      },

      /**
       * Return the track's javascript object. This is useful for subscribing to
       * data events (dataChanged)
       *
       * @param {string} viewId The id of the view containing the track
       * @param {string} trackId The id of the track within the view
       * @return {obj} The HiGlass track object for this track
       */
      getTrackObject(viewId, trackId) {
        let newViewId = viewId;
        let newTrackId = trackId;

        if (!trackId) {
          newViewId = Object.values(self.state.views)[0].uid;
          newTrackId = viewId;
        }

        return getTrackObjectFromHGC(self, newViewId, newTrackId);
      },

      /**
       * Set or get an option.
       * @param   {string}  key  The name of the option you want get or set
       * @param   {*}  value  If not `undefined`, `key` will be set to `value`
       * @return  {obj}  When `value` is `undefined` the current value of
       *   `key` will be returned.
       */
      option(key, value) {
        if (typeof value === 'undefined') return self.props.options[key];

        switch (key) {
          case 'sizeMode':
            self.props.options[key] = value;
            forceUpdate(self);
            break;

          default:
            console.warn(
              `This option "${key}" is either unknown or not settable.`,
            );
        }

        return undefined;
      },

      /**
       * Cancel a subscription.
       *
       * @param {string} event One of the available events
       * @param {function} listener The function to unsubscribe
       * @param {string} viewId The viewId to unsubscribe it from (not strictly necessary)
       * The variables used in the following examples are coming from the examples of ``on()``.
       *
       * @example
       *
       * hgv.off('location', listener, 'viewId1');
       * hgv.off('rangeSelection', rangeListener);
       * hgv.off('viewConfig', viewConfigListener);
       * hgv.off('mouseMoveZoom', mmz);
       * hgv.off('wheel', wheelListener);
       * hgv.off('createSVG');
       * hgv.off('click');
       * hgv.off('geneSearch', geneSearchListener);
       */
      off(event, listenerId, viewId) {
        const callback =
          typeof listenerId === 'object' ? listenerId.callback : listenerId;

        switch (event) {
          case 'click':
            apiPubSub.unsubscribe('click', callback);
            break;

          case 'cursorLocation':
            apiPubSub.unsubscribe('cursorLocation', callback);
            break;

          case 'location':
            self.offLocationChange(viewId, listenerId);
            break;

          case 'mouseMoveZoom':
            apiPubSub.unsubscribe('mouseMoveZoom', callback);
            break;

          case 'wheel':
            apiPubSub.unsubscribe('wheel', callback);
            break;

          case 'rangeSelection':
            apiPubSub.unsubscribe('rangeSelection', callback);
            break;

          case 'viewConfig':
            self.offViewChange(listenerId);
            break;

          case 'createSVG':
            self.offPostCreateSVG();
            break;

          case 'geneSearch':
            apiPubSub.unsubscribe('geneSearch', callback);
            break;

          default:
            // nothing
            break;
        }
      },

      /**
       * Subscribe to events
       *
       *
       * HiGlass exposes the following event, which one can subscribe to via this method:
       *
       * - location
       * - rangeSelection
       * - viewConfig
       * - mouseMoveZoom
       *
       * **Event types**
       *
       * ``click``: Returns a list of objects for each track that is below the click event.
       *
       * .. code-block:: javascript
       *
       *     [
       *      {
       *       event: {
       *          type: 'annotation',
       *          event: { ... },
       *          payload: [230000000, 561000000]
       *        },
       *       trackType: '1d-annotation',
       *       trackUid: 'xyz',
       *       viewUid: 'abc'
       *      }
       *     ]
       *
       * ``cursorLocation:`` Returns an object describing the location under the cursor
       *
       * .. code-block:: javascript
       *
       *    {
       *        absX: 100,
       *        absY: 200,
       *        relX: 50,
       *        relY: 150,
       *        relTrackX: 50,
       *        relTrackY: 100,
       *        dataX: 10000,
       *        dataY: 123456,
       *        isFrom2dTrack: false,
       *        isFromVerticalTrack: false,
       *    }
       *
       * ``location:`` Returns an object describing the visible region
       *
       * .. code-block:: javascript
       *
       *    {
       *        xDomain: [1347750580.3773856, 1948723324.787681],
       *        xRange: [0, 346],
       *        yDomain: [1856870481.5391564, 2407472678.0075483],
       *        yRange: [0, 317]
       *    }
       *
       * ``rangeSelection:`` Returns a BED- (1D) or BEDPE (1d) array of the selected data and
       * genomic range (if chrom-sizes are available)
       *
       * .. code-block:: javascript
       *
       *  // Global output
       *  {
       *    dataRange: [...]
       *    genomicRange: [...]
       *  }
       *
       *  // 1D data range
       *  [[1218210862, 1528541001], null]
       *
       *  // 2D data range
       *  [[1218210862, 1528541001], [1218210862, 1528541001]]
       *
       *  // 1D or BED-like array
       *  [["chr1", 249200621, "chrM", 50000], null]
       *
       *  // 2D or BEDPE-like array
       *  [["chr1", 249200621, "chr2", 50000], ["chr3", 197972430, "chr4", 50000]]
       *
       * ``viewConfig:`` Returns the current view config (as a string).
       *  This event is published upon interactions including:
       *  - Saving in the view config editor modal.
       *  - Panning and zooming in views, which update view object ``initialXDomain`` and ``initialYDomain`` values.
       *  - Brushing in ``viewport-projection-`` tracks containing null ``fromViewUid`` fields, which update track object ``projectionXDomain`` and ``projectionYDomain`` values.
       *
       * ``mouseMoveZoom:`` Returns the location and data at the mouse cursor's
       * screen location.
       *
       * .. code-block:: javascript
       *
       *  {
       *    // Float value of the hovering track
       *    data,
       *    // Absolute x screen position of the cursor in px
       *    absX,
       *    // Absolute y screen position of the cursor in px
       *    absY,
       *    // X screen position of the cursor in px relative to the track extent.
       *    relX,
       *    // Y screen position of the cursor in px relative to the track extent.
       *    relY,
       *    // Data x position of the cursor relative to the track's data.
       *    dataX,
       *    // Data y position of the cursor relative to the track's data.
       *    dataY,
       *    // Track orientation, i.e., '1d-horizontal', '1d-vertical', or '2d'
       *    orientation: '1d-horizontal',
       *
       *    // The following properties are only returned when hovering 2D tracks:
       *    // Raw Float32Array
       *    dataLens,
       *    // Dimension of the lens, e.g., 3 (the lens is squared so `3` corresponds
       *    // to a 3x3 matrix represented by an array of length 9)
       *    dim,
       *    // Function for converting the raw data values to rgb values
       *    toRgb,
       *    // Center position of the data or genomic position (as a BED array)
       *    center,
       *    // Range of the x data or genomic position (as a BEDPE array)
       *    xRange,
       *    // Range of the y data or genomic position (as a BEDPE array)
       *    yRange,
       *    // If `true` `center`, `xRange`, and `yRange` are given in genomic positions
       *    isGenomicCoords
       *  }
       *
       * ``createSVG:`` Set a callback to obtain the current exported SVG DOM node,
       *                and potentially return a manipulated SVG DOM node.
       *
       * @param {string} event One of the events described below
       *
       * @param {function} callback A callback to be called when the event occurs
       *
       * @param {string} viewId The view ID to listen to events
       *
       * @example
       *
       * let locationListenerId;
       * hgv.on(
       *   'location',
       *   location => console.log('Here we are:', location),
       *   'viewId1',
       *   listenerId => locationListenerId = listenerId
       * );
       *
       * const rangeListenerId = hgv.on(
       *   'rangeSelection',
       *   range => console.log('Selected', range)
       * );
       *
       * const viewConfigListenerId = hgv.on(
       *   'viewConfig',
       *   range => console.log('Selected', range)
       * );
       *
       * const mmz = event => console.log('Moved', event);
       * hgv.on('mouseMoveZoom', mmz);
       *
       * const wheelListener = event => console.log('Wheel', event);
       * hgv.on('wheel', wheelListener);
       *
       * hgv.on('createSVG', (svg) => {
       *    const circle = document.createElement('circle');
       *    circle.setAttribute('cx', 100);
       *    circle.setAttribute('cy', 100);
       *    circle.setAttribute('r', 50);
       *    circle.setAttribute('fill', 'green');
       *    svg.appendChild(circle);
       *    return svg;
       * });
       *
       * const geneSearchListener = event => {
       *    console.log('Gene searched', event.geneSymbol);
       *    console.log('Range of the gene', event.range);
       *    console.log('Center of the gene', event.centerX);
       * }
       * hgv.on('geneSearch', geneSearchListener);
       */
      on(event, callback, viewId, callbackId) {
        switch (event) {
          case 'click':
            return apiPubSub.subscribe('click', callback);

          case 'cursorLocation':
            return apiPubSub.subscribe('cursorLocation', callback);

          case 'location':
            // returns a set of scales (xScale, yScale) on every zoom event
            return self.onLocationChange(viewId, callback, callbackId);

          case 'mouseMoveZoom':
            return apiPubSub.subscribe('mouseMoveZoom', callback);

          case 'wheel':
            return apiPubSub.subscribe('wheel', callback);

          case 'rangeSelection':
            return apiPubSub.subscribe('rangeSelection', callback);

          case 'viewConfig':
            return self.onViewChange(callback);

          case 'createSVG':
            return self.onPostCreateSVG(callback);

          case 'geneSearch':
            return apiPubSub.subscribe('geneSearch', callback);

          default:
            return undefined;
        }
      },
    },
  };
};

export default createApi;
