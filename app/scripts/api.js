import ReactDOM from 'react-dom';

import {
  relToAbsChromPos,
  scalesCenterAndK,
} from './utils';

import {
  setDarkTheme, setTileProxyAuthHeader
} from './services';

import {
  MOUSE_TOOL_MOVE,
  MOUSE_TOOL_SELECT,
} from './configs';

import pubSub, { create } from './services/pub-sub';

import ChromosomeInfo from './ChromosomeInfo';

let stack = {};
let pubSubs = [];

const apiPubSub = create(stack);

export const destroy = () => {
  pubSubs.forEach(subscription => pubSub.unsubscribe(subscription));
  pubSubs = [];
  stack = {};
};

const api = function api(context) {
  const self = context;

  // Public API
  return {
    setAuthHeader(newHeader) {
      setTileProxyAuthHeader(newHeader);

      // we need to re-request all the tiles
      this.reload();
    },

    /**
     * Reload all of the tiles
     */
    reload() {

    },

    destroy() {
      ReactDOM.unmountComponentAtNode(self.topDiv.parentNode);
    },

    setViewConfig(newViewConfig) {
      /**
       * Set a new view config to define the layout and data
       * of this component
       *
       * Parameters
       * ----------
       *  newViewConfig: {}
       *    A JSON object that defines the state of the HiGlassComponent
       *
       * Returns
       * -------
       *  dataLoaded: Promise
       *    A promise that resolves when all of the data for this viewconfig
       *    is loaded
       */
      const viewsByUid = self.processViewConfig(newViewConfig);
      const p = new Promise((resolve) => {
        this.requestsInFlight = 0;

        pubSubs.push(pubSub.subscribe('requestSent', () => {
          this.requestsInFlight += 1;
        }));

        pubSubs.push(pubSub.subscribe('requestReceived', () => {
          this.requestsInFlight -= 1;

          if (this.requestsInFlight === 0) {
            resolve();
          }
        }));

        self.setState({
          viewConfig: newViewConfig,
          views: viewsByUid,
        }, () => {

        });
      });

      return p;
    },

    /**
     * Retrieve a sharable link for the current view config
     *
     * @param {string}  url  Custom URL that should point to a higlass server's
     *   view config endpoint, i.e.,
     *   `http://my-higlass-server.com/api/v1/viewconfs/`.
     * @return  {Object}  Promise resolving to the link ID and URL.
     */
    shareViewConfigAsLink(url) {
      return self.handleExportViewsAsLink(url, true);
    },

    /**
     * Show overlays where this track can be positioned
     *
     * @param {obj} track: { server, tilesetUid, datatype }
     */
    showAvailableTrackPositions(track) {
      self.setState({
        draggingHappening: track,
      });
    },

    /**
     * Hide the overlay showing wher this track can be positioned
     */
    hideAvailableTrackPositions(track) {
      self.setState({
        draggingHappening: null,
      });
    },

    /**
     * Choose a theme.
     */
    activateDarkTheme(deactivate = false) {
      setDarkTheme(deactivate);
    },

    zoomToDataExtent(viewUid) {
      /**
       * Zoom so that the entire dataset is visible
       *
       * Parameters
       * ----------
       *  viewUid: string
       *    The view uid to zoom to extent to
       *
       * Returns
       * -------
       *  nothing
       */
      self.handleZoomToData(viewUid);
    },

    getDataURI() {
      /**
       * Export the current canvas as a PNG string so that
       * it can be saved
       *
       * Return
       * ------
       *  pngString: string
       *    A data URI
       */
      return self.createDataURI();
    },

    /**
     * Activate a specific mouse tool.
     *
     * @description
     * Mouse tools enable different behaviors which would otherwise clash. For
     *
     * @param {string}  tool  Mouse tool name to be selected.
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
     * Get a property of HiGlass.
     *
     * @description
     * Returns the current value for any of the available listeners, e.g.,
     * `get(rangeSelection)` will return the current range selection without
     * requiring that a range selection event is fired.
     *
     * @param {string} prop - Name of the property.
     * @param {string} viewId - UUID of the view `prop` relates to.
     * @return {object} Promise resolving to the value.
     */
    get(prop, viewId) {
      switch (prop) {
        case 'location':
          if (typeof viewId === 'undefined') {
            return Promise.reject(
              'Please provide the view UUID sweetheart 😙',
            );
          }
          return self.getGenomeLocation(viewId);

        case 'rangeSelection':
          return Promise.resolve(self.rangeSelection);

        case 'viewConfig':
          return Promise.resolve(self.getViewsAsString());

        case 'png':
          return Promise.resolve(self.createDataURI());

        case 'svg':
        case 'svgString':
          return Promise.resolve(self.createSVGString());

        default:
          return Promise.reject(`Propert "${prop}" unknown`);
      }
    },

    goTo(
      viewUid,
      chrom1,
      start1,
      end1,
      chrom2,
      start2,
      end2,
      animateTime = 0,
      chromInfo = null,
    ) {
      // if no ChromosomeInfo is passed in, try to load it from the
      // location specified in the viewconf
      if (!chromInfo) {
        ChromosomeInfo(self.state.views[viewUid.chromInfoPath],
          (internalChromInfo) => {
            self.api().goTo(
              viewUid,
              chrom1,
              start1,
              end1,
              chrom2,
              start2,
              end2,
              animateTime,
              internalChromInfo,
            );
          },
        );
        return;
      }

      const [start1Abs, end1Abs] = relToAbsChromPos(
        chrom1, start1, end1, chromInfo,
      );

      const [start2Abs, end2Abs] = relToAbsChromPos(
        chrom2, start2, end2, chromInfo,
      );

      const [centerX, centerY, k] = scalesCenterAndK(
        self.xScales[viewUid].copy().domain([start1Abs, end1Abs]),
        self.yScales[viewUid].copy().domain([start2Abs, end2Abs]),
      );

      self.setCenters[viewUid](
        centerX, centerY, k, false, animateTime,
      );
    },

    off(event, listenerId, viewId) {
      const callback = typeof listenerId === 'object'
        ? listenerId.callback
        : listenerId;

      switch (event) {
        case 'location':
          self.offLocationChange(viewId, listenerId);
          break;

        case 'mouseMoveZoom':
          apiPubSub.unsubscribe('mouseMoveZoom', callback);
          break;

        case 'rangeSelection':
          apiPubSub.unsubscribe('rangeSelection', callback);
          break;

        case 'viewConfig':
          self.offViewChange(listenerId);
          break;

        default:
          // nothing
          break;
      }
    },

    on(event, callback, viewId, callbackId) {
      switch (event) {
        case 'location':
          return self.onLocationChange(viewId, callback, callbackId);

        case 'mouseMoveZoom':
          return apiPubSub.subscribe('mouseMoveZoom', callback);

        case 'rangeSelection':
          return apiPubSub.subscribe('rangeSelection', callback);

        case 'viewConfig':
          return self.onViewChange(callback);

        default:
          return undefined;
      }
    },
  };
};

export default api;
export const publish = apiPubSub.publish;
