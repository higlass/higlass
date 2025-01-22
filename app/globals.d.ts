export {};

declare global {
  interface Window {
    higlassTracksByType?: {
      [trackType: string]: {
        config: import('./scripts/configs/tracks-info').TrackInfo;
      };
    };
  }
}
