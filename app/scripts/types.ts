/* eslint-disable */

import type { THEME_DARK, THEME_LIGHT } from './configs';

export type Scale = import('d3-scale').ScaleContinuousNumeric<number, number>;

export type TrackPosition =
  typeof import('./configs/primitives').TRACK_LOCATIONS[number];

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
};

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
};

export type TrackConfig = UnknownTrackConfig | CombinedTrackConfig;

export type TrackVisitor = {
  (track: TrackConfig, position: null | TrackPosition): void;
};

type ZoomedFunction = {
  (
    xScale: Scale,
    yScale: Scale,
    k?: number,
    x?: number,
    y?: number,
    xPosition?: number,
    yPosition?: number,
  ): void;
};

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

/** Minimum information describing a tileset. */
export type TilesetInfoShared = {
  name: string;
  min_pos: number[]; // should be [number, number] | [number]
  max_pos: number[]; // should be [number, number] | [number]
  max_zoom: number;
  coordSystem?: string;
  tile_size?: number;
  max_tile_width?: number;
  transforms?: { name: string; value: string }[];
};

export type LegacyTilesetInfo = TilesetInfoShared & {
  max_width: number;
  bins_per_dimension?: number;
};

export type ResolutionsTilesetInfo = TilesetInfoShared & {
  resolutions: number[];
};

export type TilesetInfo = LegacyTilesetInfo | ResolutionsTilesetInfo;

export type DataConfig = {
  server?: string;
  url?: string;
  filetype?: string;
  coordSystem?: string;
  children?: DataConfig[];
  options?: unknown;
  type?: string;
  slicePos?: number;
};

export type HandleTilesetInfoFinished = {
  (info: null): void;
  (info: TilesetInfo, tilesetUid?: string): void;
  (error: { error: string }): void;
};

export interface AbstractDataFetcher<TileType> {
  tilesetInfo(
    callback?: HandleTilesetInfoFinished,
  ): Promise<TilesetInfo | undefined>;
  fetchTilesDebounced(
    receivedTiles: (tiles: Record<string, TileType>) => void,
    tileIds: string[],
  ): Promise<Record<string, TileType>>;
}

// Tileset API

type TilesRequest = {
  id: string;
  server?: string;
  tileIds: string[];
  options?: unknown;
};

type TilesetInfoRequest = {
  server: string;
  tilesetUid: string;
};

type RegisterTilesetRequest = {
  server: string;
  url: string;
  filetype: string;
  coordSystem?: string;
};

export type TileSource<T> = {
  fetchTiles: (request: TilesRequest) => Promise<Record<string, T>>;
  fetchTilesetInfo: (
    request: TilesetInfoRequest,
  ) => Promise<Record<string, TilesetInfo>>;
  registerTileset: (request: RegisterTilesetRequest) => Promise<Response>;
};
