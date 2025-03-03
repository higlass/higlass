// @ts-nocheck
const DummyTrack = function DummyTrack(HGC, ...args) {
  if (!new.target) {
    throw new Error(
      'Uncaught TypeError: Class constructor cannot be invoked without "new"',
    );
  }

  class DummyTrackClass extends HGC.tracks.PixiTrack {
    constructor(context, options) {
      super(context, options);

      this.hgc = HGC;
    }
  }
  return new DummyTrackClass(...args);
};

DummyTrack.config = {
  type: 'dummy',
  availableOptions: [],
  defaultOptions: {},
};

const trackDef = {
  name: 'DummyTrack',
  track: DummyTrack,
  config: DummyTrack.config,
};

const register = () => {
  window.higlassTracks = window.higlassTracks || {};
  window.higlassTracksByType = window.higlassTracksByType || {};

  window.higlassTracks[trackDef.name] = trackDef;
  window.higlassTracksByType[trackDef.config.type] = trackDef;
};

export default DummyTrack;

export { register };
