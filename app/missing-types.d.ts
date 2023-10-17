/* eslint-disable */
export {};

declare global {
  interface Window {
    higlassTracksByType?: {
      [trackType: string]: { config: unknown }
    }
  }
}
