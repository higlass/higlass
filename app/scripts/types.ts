import type * as configs from './configs';
import type { ChromsizeRow } from './utils/parse-chromsizes-rows';

export type Theme = typeof configs.THEME_DARK | typeof configs.THEME_LIGHT;
export type SizeMode =
  | typeof configs.SIZE_MODE_DEFAULT
  | typeof configs.SIZE_MODE_BOUNDED
  | typeof configs.SIZE_MODE_OVERFLOW
  | typeof configs.SIZE_MODE_BOUNDED_OVERFLOW
  | typeof configs.SIZE_MODE_SCROLL;

// TODO: Generate from 'schema.json'
export type HiGlassViewConfig = Record<string, unknown>;

/** Additional options for how the {@link HiGlassComponent} is drawn and behaves */
export interface HiGlassOptions {
  /** An auth token to be included with every tile request. */
  authToken?: string;
  /**
   * Whether the component should be sized to fit within the enclosing div.
   *
   * If `false`, the component will grow as needed to fit the tracks within it.
   */
  bounded?: boolean;
  /**
   * Whether the layout be changed.
   *
   * If `false`, the view headers will be hidden. Overrides the `editable` value in the viewconf if specified.
   */
  editable?: boolean;
  /** A set of default options that will be used for newly added tracks. */
  defaultTrackOptions?: {
    /** Options for all tracks types. */
    all?: Record<string, unknown>;
    /** Options for specific tracks types. */
    trackSpecific?: Record<string, Record<string, unknown>>;
  };
  viewMarginTop?: number;
  viewMarginBottom?: number;
  viewMarginLeft?: number;
  viewMarginRight?: number;
  viewPaddingTop?: number;
  viewPaddingBottom?: number;
  viewPaddingLeft?: number;
  viewPaddingRight?: number;
  theme?: 'dark' | 'light';
  isDarkTheme?: boolean;
  moustTool?: 'select' | 'track-select';
  pluginTracks?: Record<string, unknown>;
  pluginDataFetchers?: Record<string, unknown>;
  pixelPreciseMarginPadding?: boolean;
  sizeMode?: SizeMode;
  renderer?: 'canvas';
  onViewConfLoaded?: () => void;
  cheatCodesEnabled?: boolean;
  rangeSelectionOnAlt?: boolean;
  tracksEditable?: boolean;
  zoomFixed?: boolean;
  containerPaddingX?: number;
  containerPaddingY?: number;
  broadcastMousePositionGlobally?: boolean;
  showGlobalMousePosition?: boolean;
  globalMousePosition?: boolean;
}

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
  flipText?: boolean;
  originalTrack?: TrackObject;
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
  fetching?: Set<unknown>;
  tilesetInfo?: TilesetInfo;
  chromInfo?: unknown; // TODO
}

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
