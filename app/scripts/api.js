import {
  relToAbsChromPos,
  scalesCenterAndK
} from './utils';

import {
  MOUSE_TOOL_MOVE,
  MOUSE_TOOL_SELECT
} from './configs';

export const api = function api(context) {
  const self = context;

  return {
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

    goTo (
      viewUid,
      chrom1,
      start1,
      end1,
      chrom2,
      start2,
      end2,
      animate=false,
      animateTime=3000
    ) {
      // Set chromInfo if not available
      if (!self.chromInfo) {
        self.setChromInfo(
          self.state.views[viewUid].chromInfoPath,
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
              animateTime
            );
          }
        );
        return;
      }

      const [start1Abs, end1Abs] = relToAbsChromPos(
        chrom1, start1, end1, self.chromInfo
      );

      const [start2Abs, end2Abs] = relToAbsChromPos(
        chrom2, start2, end2, self.chromInfo
      );

      let [centerX, centerY, k] = scalesCenterAndK(
        self.xScales[viewUid].copy().domain([start1Abs, end1Abs]),
        self.yScales[viewUid].copy().domain([start2Abs, end2Abs])
      );

      self.setCenters[viewUid](
        centerX, centerY, k, false, animate, animateTime
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

        case 'view':
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

        case 'view':
          return self.onViewChange(callback);

        default:
          // nothing
          break;
      }
    },

    refresh(force = false) {
      if (self.props.options.bounded) {
        self.fitPixiToParentContainer();
      }

      self.updateAfterResize();
      self.render();
      self.animate();

      if (force) {
        self.forceRefreshView();
      }
    }
  };
}

export default api;
