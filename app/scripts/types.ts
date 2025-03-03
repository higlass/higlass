import type { THEME_DARK, THEME_LIGHT } from './configs';
import type { ChromsizeRow } from './utils/parse-chromsizes-rows';

export type Scale = import('d3-scale').ScaleContinuousNumeric<number, number>;

// biome-ignore format: Biome formatting messes up tsc parsing
export type TrackPosition = typeof import('./configs/primitives').TRACK_LOCATIONS[number];

export type ChromInfo<Name extends string = string> = {
  cumPositions: { id?: number; pos: number; chr: Name }[];
  chrPositions: Record<Name, { pos: number }>;
  chromLengths: Record<Name, number>;
  totalLength: number;
};

export type UnknownTrackConfig = {
  type: string;
  uid: string;
  server: string;
  tilesetUid: string;
  options?: Record<string, unknown>;
  position?: TrackPosition;
  data?: Record<string, unknown>;
  coordSystem?: unknown;
  height?: number;
  width?: number;
  x?: number;
  y?: number;
  chromInfoPath?: string;
  projectionXDomain?: [number, number];
  projectionYDomain?: [number, number];
  registerViewportChanged?: unknown;
  removeViewportChanged?: unknown;
  setDomainsCallback?: unknown;
};

export type CombinedTrackConfig = {
  type: 'combined';
  contents: Array<UnknownTrackConfig>;
  uid: string;
  server?: string;
  height?: number;
  width?: number;
  tilesetUid?: string;
  options?: Record<string, unknown>;
  position?: TrackPosition;
  data?: Record<string, unknown>;
  coordSystem?: unknown;
  x?: number;
  y?: number;
  chromInfoPath?: string;
  projectionXDomain?: [number, number];
  projectionYDomain?: [number, number];
  registerViewportChanged?: unknown;
  removeViewportChanged?: unknown;
  setDomainsCallback?: unknown;
};

export type TrackConfig = UnknownTrackConfig | CombinedTrackConfig;

export type TrackVisitor = (
  track: TrackConfig,
  position: null | TrackPosition,
) => void;

type ZoomedFunction = (
  xScale: Scale,
  yScale: Scale,
  k?: number,
  x?: number,
  y?: number,
  xPosition?: number,
  yPosition?: number,
) => void;

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
  chromsizes?: ArrayLike<ChromsizeRow>;
  error?: string;
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
  // biome-ignore lint/suspicious/noExplicitAny: We can't know what the options are
  options?: Record<string, any>;
  type?: string;
  slicePos?: number;
};

export type HandleTilesetInfoFinished = (
  info: TilesetInfo | null | { error: string },
  tilesetUid?: string,
) => void;

export interface AbstractDataFetcher<TileType, DataConfig> {
  tilesetInfo(
    callback?: HandleTilesetInfoFinished,
  ): Promise<TilesetInfo | undefined>;
  fetchTilesDebounced(
    receivedTiles: (tiles: Record<string, TileType>) => void,
    tileIds: string[],
  ): Promise<Record<string, TileType>>;
  dataConfig: DataConfig;
}

// Tileset API

export type TilesRequest = {
  id: string;
  tileIds: Array<string>;
  server: string;
  // biome-ignore lint/suspicious/noExplicitAny: We can't know what the options are
  options?: Record<string, any>;
};

export type TilesetInfoRequest = {
  server: string;
  tilesetUid: string;
};

export type RegisterTilesetRequest = {
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
