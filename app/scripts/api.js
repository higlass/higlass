import {
  relToAbsChromPos,
  scalesCenterAndK,
} from './utils';

import {
  MOUSE_TOOL_MOVE,
  MOUSE_TOOL_SELECT,
} from './configs';

import pubSub from './services/pub-sub';
import ChromosomeInfo from './ChromosomeInfo';

export const api = function api(context) {
  const self = context;

  return {
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
      const p = new Promise((resolve, reject) => {

        this.requestsInFlight = 0;

        const requestsSent = pubSub.subscribe('requestSent', (url) => {
          this.requestsInFlight += 1;
        });

        const requestsReceived = pubSub.subscribe('requestReceived', (url) => {
          this.requestsInFlight -= 1;

          if (this.requestsInFlight == 0) {
            resolve();
          }
        });

        self.setState({
          views: viewsByUid,
        }, () => {

        });
      });

      return p;
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
      animate = false,
      animateTime = 3000,
      chromInfo = null,
    ) {
      console.log('goTo:', chromInfo);
      // if no ChromosomeInfo is passed in, try to load it from the
      // location specified in the viewconf
      if (!chromInfo) {
        ChromosomeInfo(self.state.views[viewUid.chromInfoPath],
          () => {
            self.api().goTo(
              viewUid,
              chrom1,
              start1,
              end1,
              chrom2,
              start2,
              end2,
              animate,
              animateTime,
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
        centerX, centerY, k, false, animate, animateTime,
      );
    },

    off(event, listenerId, viewId) {
      switch (event) {
        case 'location':
          self.offLocationChange(viewId, listenerId);
          break;

        case 'rangeSelection':
          self.offRangeSelection(listenerId);
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
          self.onLocationChange(viewId, callback, callbackId);
          break;

        case 'rangeSelection':
          return self.onRangeSelection(callback);

        case 'viewConfig':
          return self.onViewChange(callback);

        default:
          // nothing
          break;
      }
    },
  };
};

export default api;
