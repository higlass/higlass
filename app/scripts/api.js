const api = function api(context) {
  const self = context;

  return {
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

    off(event, viewId, listenerId) {
      switch (event) {
        case 'location':
          self.offLocationChange(viewId, listenerId);
          break;

        case 'view':
          self.offViewChange(callbackId);
          break;

        default:
          // nothing
          break;
      }
    },

    on(event, viewId, callback, callbackId) {
      switch (event) {
        case 'location':
          self.onLocationChange(viewId, callback, callbackId);
          break;

        case 'view':
          return self.onViewChange(callback);

        default:
          // nothing
          break;
      }
    },

    refresh() {
      if (self.props.options.bounded) {
        self.fitPixiToParentContainer();
      }

      self.render();
      self.animate();

      return _api;
    }
  };
}

export default api;
