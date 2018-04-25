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
    setDarkTheme(darkTheme) {
      setDarkTheme(!!darkTheme);
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

    /*
     * Get the current view as a Data URI
     *
     * @return {string} A data URI describing the current state of the canvas
     */
    exportAsPng() {
      return self.createDataURI();
    }

    /*
     * Get the current view as an SVG. Relies on all the tracks implementing
     * their respective exportAsSVG methods.
     *
     * @return {string} An SVG string of the current view.
     */
    exportAsSvg() {
      return self.createSVGString();
    }

    /*
     * Export the current view as a Viewconf.
     *
     * @return {string} A stringified version of the current viewconf
    */
    exportAsViewConfString() {
      return self.getViewsAsString();
    }

    /*
     * Get the current range selection
     *
     * @return {???} What is the return type here??
     */
    getRangeSelection() {
      return self.rangeSelection;
    }

    getLocation(viewId) {
      if (typeof viewId === 'undefined') {
        return 'Please provide the view UUID sweetheart 😙';
      }
      return {
        xDomain: [self.xScales[viewId].domain()],
        yDomain: [self.yScales[viewId].domain()]
      }
    }

    zoomTo(
      viewUid,
      start1Abs,
      end1Abs,
      start2Abs,
      end2Abs,
      animateTime = 0,
    ) {
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
          // returns a set of scales (xScale, yScale) on every zoom event
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
