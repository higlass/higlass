/* eslint-disable */

export type TrackPosition = typeof import('./configs/primitives').TRACK_LOCATIONS[number];

export type ChromInfo<Name extends string = string> = {
    cumPositions: { id?: number; pos: number; chr: Name }[];
    chrPositions: Record<Name, { pos: number }>;
    chromLengths: Record<Name, number>;
    totalLength: number;
};

export type UnknownTrackConfig = {
  uid: string;
  options: Record<string, unknown>;
  type: string;
  position: TrackPosition;
  data?: Record<string, unknown>;
  server: string;
  tilesetUid: string;
  coordSystem?: unknown;
  x?: number;
  y?: number;
  chromInfoPath: string;
  projectionXDomain?: [number, number];
  projectionYDomain?: [number, number];
  registerViewportChanged?: unknown;
  removeViewportChanged?: unknown;
  setDomainsCallback?: unknown;
}

export type CombinedTrackConfig = {
  uid: string;
  options: Record<string, unknown>;
  contents: TrackConfig[];
  type: 'combined';
  position: TrackPosition;
  data?: Record<string, unknown>;
  server: string;
  tilesetUid: string;
  coordSystem?: unknown;
  x?: number;
  y?: number;
  chromInfoPath: string;
  projectionXDomain?: [number, number];
  projectionYDomain?: [number, number];
  registerViewportChanged?: unknown;
  removeViewportChanged?: unknown;
  setDomainsCallback?: unknown;
}

export type TrackConfig = UnknownTrackConfig | CombinedTrackConfig;

export type TrackVisitor = {
  (track: TrackConfig, position: null | TrackPosition): void;
}
