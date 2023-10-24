/* eslint-disable */

import type { THEME_DARK, THEME_LIGHT } from "./configs";

export type Scale = import("d3-scale").ScaleContinuousNumeric<number, number>;

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

type ZoomedFunction = {
  (xScale: Scale, yScale: Scale, k?: number, x?: number, y?: number, xPosition?: number, yPosition?: number): void;
}

export interface TrackObject {
  draw(): void;
  rerender(options: unknown): void;
  delayDrawing: boolean;
  childTracks?: TrackObject[];
  createdTracks: Record<string, TrackObject>;
  refScalesChanged(x: Scale, y: Scale): void;
  position: [number, number];
  dimensions: [number, number];
  updateContents(contents: TrackConfig[], x: unknown): TrackObject;
  zoomed: ZoomedFunction;
  setPosition(position: [number, number]): void;
  setDimensions(dimensions: [number, number]): void;
  remove(): void;
  movedY(extent: number): void;
  zoomedY(yPosition: number, wheelDelta: number): void;
}

export type Theme = typeof THEME_DARK | typeof THEME_LIGHT;
