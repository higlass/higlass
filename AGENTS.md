# HiGlass — Agent Reference

## What is HiGlass?

A web-based viewer for large genomic/Hi-C datasets that supports synchronized multi-view navigation with GPU-accelerated rendering. Live at https://higlass.io.

## Project Basics

- **License**: MIT
- **Node**: 22.x recommended
- **Package**: Published to npm as `higlass`

## Tech Stack

| Layer        | Technology                                                               |
| ------------ | ------------------------------------------------------------------------ |
| UI Framework | React 16/17/18/19 (class components, no hooks)                           |
| Rendering    | Pixi.js 5/6 (WebGL), D3.js (zoom/scales/brushing)                        |
| Build        | Vite 5, TypeScript 5.7, Babel 7 (ES5 class compat)                       |
| Testing      | Vitest 3 + Playwright browser, MSW for API mocking                       |
| Linting      | Biome 1.9 (single quotes, semicolons, 80-char lines)                     |
| Styling      | SCSS modules, CSS injected via JS                                        |
| State Mgmt   | Custom Pub/Sub (`pub-sub-es`) + React component state (no Redux/Context) |

## Source Code Structure (`app/scripts/`)

```
app/scripts/
├── hglib.jsx                  # Library entry point
├── HiGlassComponent.jsx       # Root React component (~166KB)
├── TiledPlot.jsx              # View container (~91KB)
├── TrackRenderer.jsx          # Track rendering engine (~79KB)
├── api.js                     # Public API (~36KB)
├── configs/                   # Track types, colormaps, defaults
├── data-fetchers/             # Data source implementations
├── services/                  # Tile proxy, worker, chrom-info, DOM events
├── utils/                     # 100+ utility modules (incl. react-dom-compat.js)
├── hocs/                      # HOCs: pub-sub, theme, modal
├── plugins/                   # Plugin system for custom tracks
└── [150+ track implementations]
```

## Track Class Hierarchy

```
Track (base — app/scripts/Track.js)
  └─ PixiTrack (Pixi.js graphics, labels, SVG export — app/scripts/PixiTrack.js)
       └─ TiledPixiTrack (tile fetching/caching, zoom levels — app/scripts/TiledPixiTrack.js)
            ├─ Tiled1DPixiTrack → BarTrack, LineTrack, BedLikeTrack...
            └─ HeatmapTiledPixiTrack (2D heatmaps)
```

30+ track types: heatmaps, gene annotations, line/bar charts, arrowhead domains, CNV intervals, map tiles, and more.

## Key NPM Scripts

| Command              | Purpose                                        |
| -------------------- | ---------------------------------------------- |
| `npm start`          | Vite dev server (port 5173)                    |
| `npm run build`      | TypeScript emit + Vite build (UMD + ESM)       |
| `npm run typecheck`  | `tsc` type checking                            |
| `npm run lint`       | Biome CI linting                               |
| `npm run format`     | Biome auto-format                              |
| `npm test`           | Vitest (browser mode, 4 parallel shards in CI) |
| `npm run test-watch` | Vitest watch with visible browser              |

## CI/CD (`.github/workflows/`)

- **ci.yml**: Typecheck → Lint → Schema validation → Tests (4 shards, Playwright)
- **npmpublish.yml**: Publishes to npm on `v*` tags
- **docs.yml**: Builds Sphinx docs, deploys to S3

## Contributing Guidelines

- PRs require a **changelog entry** in `CHANGELOG.md`
- Use `[WIP]` prefix for in-progress PRs
- **Biome** enforces coding style — run `npm run format` before committing
- Docs use **Sphinx** with reStructuredText

## Architecture Highlights

- **No global state store** — uses Pub/Sub events + React class component state + instance variables
- **Plugin system** — register custom tracks via `window.higlassTracksByType` and data fetchers via `window.higlassDataFetchersByType`
- **Data flow**: Track → DataFetcher → tile-proxy (batched/debounced) → HTTP to server → Web Worker processing → LRU cache → Track render
- **Dual output**: UMD (`dist/hglib.js`) and ESM (`dist/higlass.mjs`), with React & Pixi.js as peer dependencies
- **SVG export** support for publication-quality figures

## React Multi-Version Support

HiGlass supports React 16, 17, 18, and 19 as peer dependencies. Key details:

- **Rendering compat layer** (`app/scripts/utils/react-dom-compat.js`): Detects `createRoot` (React 18+) at runtime and falls back to legacy `ReactDOM.render` (React 16/17). All mounting/unmounting goes through `renderToContainer`/`unmountFromContainer`.
- **`ref` callback pattern**: Class component refs use callback refs (`ref={(r) => { ... }}`), which work across all React versions. React 19 passes `ref` as a regular prop to function components, so function components that receive `ref` must not rely on `forwardRef`.
- **`hglib.launch()`** (`app/scripts/hglib.jsx`): After rendering, polls for `trackRenderer` readiness on each view because React 18/19 `createRoot` renders asynchronously (unlike `ReactDOM.render`).
- **Tests use React 17** (`devDependencies`) with Enzyme adapter. The browser-mode Vitest setup uses `ReactDOM.render` (synchronous). Some tests call `hgc.setState()` directly on the Enzyme wrapper and expect synchronous DOM updates.

## react-grid-layout v2 Integration

HiGlass uses react-grid-layout v2's **native API** (not the `react-grid-layout/legacy` wrapper). Key differences from v1 and gotchas:

### v2 API (composable config objects, not flat props)

```jsx
<ReactGridLayout
  gridConfig={{ cols, rowHeight, margin, containerPadding }}
  dragConfig={{ enabled, handle }}
  resizeConfig={{ enabled }}
  compactor={getCompactor("vertical")} // or getCompactor(null) for no compaction
  layout={layouts}
  width={width}
  onLayoutChange={handler}
/>
```

- `getCompactor()` returns stable module-level constants — import it from `react-grid-layout`.
- `compactType` (v1 string prop) is replaced by `compactor` (object).
- `verticalCompact`, `measureBeforeMount`, `onBreakpointChange`, `useCSSTransforms` are removed.

### Async layout synchronization

**v2's `GridLayout` is a function component that syncs layout via `useEffect` (not `useLayoutEffect`).** This means layout state updates are asynchronous — after passing a new `layout` prop, the grid items' DOM dimensions are not updated until after the next paint. This has major implications:

- **Grid item sizing can be stale**: After mutating `view.layout.h` (e.g. via `adjustLayoutToTrackSizes`) and calling `setState`, the grid item's DOM height is still the old value until `useEffect` fires. If `TiledPlot.measureSize()` is called synchronously after setState, it reads stale dimensions.
- **Mitigation via `maxHeight`**: The `<div key={view.uid}>` grid item child has a `maxHeight` style computed from `view.layout.h` using the same formula as react-grid-layout's internal `calcGridItemWHPx`: `Math.round(rowHeight * h + Math.max(0, h - 1) * margin)`. This constrains `TiledPlot.measureSize()` to the correct height even when the grid's internal state is stale.
- **`processGridItem` returns `null`** if a child's key is not found in the grid's internal layout state. Since internal state lags the `layout` prop by one useEffect cycle, newly added views may not render on the first pass.

### Width-zero bootstrap problem

`HiGlassComponent` initializes `state.width = 0`. In v1 this was harmless, but v2's `calcGridColWidth` produces negative column widths when `containerWidth = 0`, causing grid items to render with zero/negative dimensions. `TiledPlot`'s `ResizeSensor` (from `css-element-queries`) uses a scroll-based technique that fails to detect resize from 0 to N pixels.

**Fix**: `componentDidMount` measures the element's initial dimensions via `getElementDim()` and includes them in the first `setState` call, ensuring ReactGridLayout never renders with `width = 0`.

### Style merging

GridItem uses `React.cloneElement` with style merge order: `GridItem style → child style → position styles`. Position styles (`width`, `height`, `transform`, `position: absolute`) have highest priority. Child `maxHeight`/`overflow` props survive because position styles don't set those properties.

## Key Abstractions

### Track Lifecycle

```
constructor(context, options)
  → initTile(tile)       // Set up tile graphics
  → updateTile(tile)     // Check if re-render needed
  → renderTile(tile)     // Draw pixel/graphics data
  → draw()               // Composite all tiles
  → zoomed(xScale, yScale) // Update on zoom/pan
```

### Track Context Object

Passed to every track constructor:

- `id` — Track identifier
- `pubSub` — Event bus (pub-sub-es)
- `getTheme()` — Theme accessor
- `onValueScaleChanged()` — Callback for scale updates
- `onTrackOptionsChanged()` — Callback for option updates
- `onMouseMoveZoom()` — Callback for mouse events
- `svg`/`canvas` elements — Rendering targets

### Pub/Sub Topics

- `app.mouseMove`, `app.click`, `app.zoom` — User interaction events
- Global and per-component pub-sub instances for decoupled communication

### HOCs (`app/scripts/hocs/`)

- `with-pub-sub.js` — Pub/Sub provider
- `with-theme.jsx` — Theme management (light/dark)
- `with-modal.jsx` — Modal context

## Extensibility

- **Custom Tracks**: Register via `window.higlassTracksByType`
- **Data Fetchers**: Implement `AbstractDataFetcher` interface, register via `window.higlassDataFetchersByType`
- **Plugins**: Access base classes via `AVAILABLE_FOR_PLUGINS`
- **Colormaps**: Add to `HEATED_OBJECT_MAP` config
- **Track Options**: Define in `configs/tracks-info.js` `optionsInfo`

## Build Output

- `dist/hglib.js` — UMD build
- `dist/hglib.min.js` — Minified UMD
- `dist/higlass.mjs` — ESM build
- `dist/hglib.css` — CSS placeholder (styles injected via JS)

## Key Dependencies

- **pixi.js** (peer) — WebGL renderer
- **d3-\*** modules — Scales, zoom, brushing, color
- **ndarray** — N-dimensional array operations
- **react-grid-layout** v2 — Grid layout system (native v2 API, not legacy wrapper)
- **ajv** — JSON schema validation
- **pub-sub-es** — Event bus
- **slugid** — Unique ID generation
