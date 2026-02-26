/**
 * A custom script that builds the higlass library and writes it to the dist/ directory.
 *
 * Ideally we could just use Vite's build (or just esbuild), but the legacy compatability
 * needs of HiGlass require some extra modifications to the build outputs.
 *
 * In this file you will find:
 *
 * 1.) A Vite build that generates the UMD and ESM builds
 * 2.) A babel transform that transpiles the UMD and ESM builds to ES5 classes. This is
 *   necessary for HiGlass plugins to work (see: https://github.com/higlass/higlass/pull/1141#issue-1561403774)
 * 3.) A esbuild transform that minifies the UMD build (for hglib.min.js)
 * 4.) A custom HTML templates that shows usage of the UMD and ESM builds
 *
 * If we end up moving towards a more modern build (i.e., ESM only with ES6 classes), then
 * this file can be removed.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

import * as esbuild from 'esbuild';
import * as vite from 'vite';
import babel from 'vite-plugin-babel';

import * as PIXI from 'pixi.js';
import * as React from 'react';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const REACT_VERSION = React.version.split('.')[0];
const PIXI_VERSION = PIXI.VERSION.split('.')[0];

/**
 * @template {string} T
 * @param {Awaited<ReturnType<typeof vite.build>>} buildResult
 * @param {ReadonlyArray<T>} filenames
 * @returns {{ [K in T]: string }}
 */
function collectExpectedViteBuildOutputs(buildResult, filenames) {
  if (!Array.isArray(buildResult)) {
    throw new Error('Expected an array of outputs');
  }
  /** @type {Set<string>} */
  const found = new Set(filenames);
  /** @type {Record<string, string>} */
  const result = {};
  for (const { output } of buildResult) {
    for (const file of output) {
      const contents = file.type === 'asset' ? file.source : file.code;
      if (found.has(file.fileName) && typeof contents === 'string') {
        result[file.fileName] = contents;
        found.delete(file.fileName);
      }
    }
  }
  if (found.size > 0) {
    throw new Error(`Could not find outputs: ${[...found].join(', ')}`);
  }
  // @ts-expect-error - We know that all the filenames exist in the result
  return result;
}

/**
 * Generates the UMD and ESM builds library code.
 *
 * @returns {Promise<{ umd: string, minifiedUmd: string, esm: string }>}
 */
async function build() {
  const viteBuildResult = await vite.build({
    configFile: path.resolve(__dirname, '../vite.config.mjs'),
    build: {
      write: false,
      minify: false,
      cssMinify: true,
      lib: {
        entry: path.resolve(__dirname, '../app/scripts/hglib.jsx'),
        name: 'hglib',
        formats: ['umd', 'es'],
      },
      rolldownOptions: {
        external: ['react', 'react-dom', 'pixi.js'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'pixi.js': 'PIXI',
          },
        },
      },
    },
    plugins: [
      // TODO(2023-11-28): Need to transpile all classes to ES5 for plugins.
      // Can remove (i.e., upgrade to native ES6) when we decide to make a
      // upgrade to ES6 classes (requiring plugins to do the same).
      // See PR: https://github.com/higlass/higlass/pull/1141
      babel({
        babelConfig: {
          babelrc: false,
          configFile: false,
          presets: ['@babel/preset-react'],
          plugins: ['@babel/plugin-transform-classes'],
          generatorOpts: { importAttributesKeyword: 'with' },
        },
      }),
    ],
  });

  const expected = collectExpectedViteBuildOutputs(viteBuildResult, [
    'higlass.umd.js',
    'higlass.mjs',
  ]);

  const minifiedUmd = await esbuild.transform(expected['higlass.umd.js'], {
    minify: true,
  });

  return {
    umd: expected['higlass.umd.js'],
    minifiedUmd: minifiedUmd.code,
    esm: expected['higlass.mjs'],
  };
}

/**
 * Generate HTML template for the demo page.
 *
 * The import block needs to be replaced, depending on the ESM vs UMD build.
 * See usage in main().
 *
 * @param {string} importHTML - The HTML block where libaries are imported
 */
async function generateHTML(importHTML) {
  const template = await fs.promises.readFile(
    path.resolve(__dirname, '../index.html'),
    { encoding: 'utf-8' },
  );
  return template.replace(
    /<!-- HIGLASS IMPORT -->(.|\n)*<!-- HIGLASS IMPORT -->/,
    importHTML,
  );
}

/**
 * Build the library and write it.
 *
 * @param {object} options
 * @param {string} options.outDir
 */
async function main({ outDir }) {
  const bundle = await build();
  await Promise.all([
    fs.promises.mkdir(outDir, { recursive: true }),
    // CSS
    fs.promises.writeFile(
      path.resolve(outDir, 'hglib.css'),
      `\
/* Since, v1.13.3 HiGlass styles are now injected via JS. No need to separately load this file. */
`,
    ),
    // UMD
    fs.promises.writeFile(path.resolve(outDir, 'hglib.js'), bundle.umd),
    fs.promises.writeFile(
      path.resolve(outDir, 'hglib.min.js'),
      bundle.minifiedUmd,
    ),
    fs.promises.writeFile(
      path.resolve(outDir, 'index.html'),
      await generateHTML(`\
    <script src="https://unpkg.com/react@${REACT_VERSION}/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@${REACT_VERSION}/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/pixi.js@${PIXI_VERSION}/dist/browser/pixi.min.js"></script>
    <script src="./hglib.min.js"></script>
  `),
    ),
    // ESM
    fs.promises.writeFile(path.resolve(outDir, 'higlass.mjs'), bundle.esm),
    fs.promises.writeFile(
      path.resolve(outDir, 'esm.html'),
      await generateHTML(`\
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@${REACT_VERSION}",
          "react-dom": "https://esm.sh/react-dom@${REACT_VERSION}",
          "pixi.js": "https://esm.sh/pixi.js@${PIXI_VERSION}"
        }
      }
    </script>
    <script type="module">
      import * as hglib from "./higlass.mjs";
      globalThis.hglib = hglib;
      console.log("CSS length:", hglib.CSS?.length);
    </script>
  `),
    ),
    // Shadow DOM ESM demo (same viewConfig/importmap as esm.html)
    fs.promises.writeFile(
      path.resolve(outDir, 'shadow-dom.html'),
      `\
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>HiGlass — Shadow DOM</title>
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@${REACT_VERSION}",
          "react-dom": "https://esm.sh/react-dom@${REACT_VERSION}",
          "pixi.js": "https://esm.sh/pixi.js@${PIXI_VERSION}"
        }
      }
    </script>
    <style type="text/css">
      #demo {
        position: absolute;
        left: 1rem;
        top: 1rem;
        bottom: 1rem;
        right: 1rem;
        overflow: hidden;
      }
    </style>
  </head>

  <body>
    <div id="demo"></div>
  </body>

  <script type="module">
    import { viewer, CSS } from "./higlass.mjs";

    // Set up shadow root on #demo
    const demo = document.getElementById('demo');
    const shadow = demo.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = CSS;
    shadow.appendChild(style);

    const container = document.createElement('div');
    container.style.cssText = 'width:800px;height:600px';
    shadow.appendChild(container);

    const viewConfig = {
      zoomFixed: false,
      views: [
        {
          layout: { w: 12, h: 7, x: 0, y: 0 },
          uid: 'aa',
          initialYDomain: [2534823997.9776945, 2547598956.834603],
          initialXDomain: [2521015726.4619913, 2558682921.8435397],
          tracks: {
            left: [],
            top: [
              {
                uid: 'genes',
                tilesetUid: 'OHJakQICQD6gTD7skx4EWA',
                server: 'http://higlass.io/api/v1',
                type: 'horizontal-gene-annotations',
                height: 48,
                options: {
                  labelColor: 'black',
                  plusStrandColor: 'black',
                  labelPosition: 'hidden',
                  minusStrandColor: 'black',
                  fontSize: 11,
                  trackBorderWidth: 0,
                  trackBorderColor: 'black',
                  showMousePosition: true,
                  mousePositionColor: '#000000',
                  geneAnnotationHeight: 10,
                  geneLabelPosition: 'outside',
                  geneStrandSpacing: 4
                },
              },
              {
                uid: 'line1',
                tilesetUid: 'PjIJKXGbSNCalUZO21e_HQ',
                height: 20,
                server: 'http://higlass.io/api/v1',
                type: 'horizontal-line',
                options: {
                  valueScaling: 'linear',
                  lineStrokeWidth: 2,
                  lineStrokeColor: '#4a35fc',
                  labelPosition: 'topLeft',
                  labelColor: 'black',
                  axisPositionHorizontal: 'right',
                  trackBorderWidth: 0,
                  trackBorderColor: 'black',
                  labelTextOpacity: 0.4,
                  showMousePosition: true,
                  mousePositionColor: '#000000',
                  showTooltip: false
                }
              },
              {
                uid: 'line2',
                tilesetUid: 'PdAaSdibTLK34hCw7ubqKA',
                height: 20,
                server: 'http://higlass.io/api/v1',
                type: 'horizontal-line',
                options: {
                  valueScaling: 'linear',
                  lineStrokeWidth: 2,
                  lineStrokeColor: '#d104fa',
                  labelPosition: 'topLeft',
                  labelColor: 'black',
                  axisPositionHorizontal: 'right',
                  trackBorderWidth: 0,
                  trackBorderColor: 'black',
                  labelTextOpacity: 0.4,
                  showMousePosition: true,
                  mousePositionColor: '#000000',
                  showTooltip: false
                },
              },
              {
                uid: 'line3',
                tilesetUid: 'e0DYtZBSTqiMLHoaimsSpg',
                height: 20,
                server: 'http://higlass.io/api/v1',
                type: 'horizontal-line',
                options: {
                  valueScaling: 'linear',
                  lineStrokeWidth: 2,
                  lineStrokeColor: '#ff0000',
                  labelPosition: 'topLeft',
                  labelColor: 'black',
                  axisPositionHorizontal: 'right',
                  trackBorderWidth: 0,
                  trackBorderColor: 'black',
                  labelTextOpacity: 0.4,
                  showMousePosition: true,
                  mousePositionColor: '#000000',
                  showTooltip: false
                },
              },
              {
                uid: 'line4',
                tilesetUid: 'cE0nGyd0Q_yVYSyBUe89Ww',
                height: 20,
                server: 'http://higlass.io/api/v1',
                type: 'horizontal-line',
                options: {
                  valueScaling: 'linear',
                  lineStrokeWidth: 2,
                  lineStrokeColor: 'orange',
                  labelPosition: 'topLeft',
                  labelColor: 'black',
                  axisPositionHorizontal: 'right',
                  trackBorderWidth: 0,
                  trackBorderColor: 'black',
                  labelTextOpacity: 0.4,
                  showMousePosition: true,
                  mousePositionColor: '#000000',
                  showTooltip: false
                },
              },
              {
                uid: 'chroms',
                height: 18,
                chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
                type: 'horizontal-chromosome-labels',
                options: {
                  color: '#777777',
                  stroke: '#FFFFFF',
                  fontSize: 11,
                  fontIsLeftAligned: true,
                  showMousePosition: true,
                  mousePositionColor: '#000000'
                },
              }
            ],
            right: [],
            center: [
              {
                uid: 'center',
                type: 'combined',
                contents: [
                  {
                    server: 'http://higlass.io/api/v1',
                    tilesetUid: 'dVBREuC2SvO01uXYMUh2aQ',
                    type: 'heatmap',
                    uid: 'Yqetzqw6Qfy-hREAJhAXEA',
                    options: {
                      backgroundColor: '#eeeeee',
                      labelPosition: 'topLeft',
                      labelTextOpacity: 0.4,
                      colorRange: [
                        'white',
                        'rgba(245,166,35,1.0)',
                        'rgba(208,2,27,1.0)',
                        'black'
                      ],
                      maxZoom: null,
                      colorbarPosition: 'topRight',
                      trackBorderWidth: 0,
                      trackBorderColor: 'black',
                      heatmapValueScaling: 'log',
                      showMousePosition: true,
                      mousePositionColor: '#000000',
                      showTooltip: true,
                      scaleStartPercent: '0.00000',
                      scaleEndPercent: '1.00000',
                      showMousePositionGlobally: true,
                    },
                  }
                ],
              }
            ],
            bottom: [],
            whole: [],
            gallery: []
          },
          chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
          genomePositionSearchBox: {
            visible: true,
            chromInfoServer: 'http://higlass.io/api/v1',
            chromInfoId: 'hg19',
            autocompleteServer: 'http://higlass.io/api/v1',
            autocompleteId: 'OHJakQICQD6gTD7skx4EWA'
          }
        }
      ],
      editable: true,
      viewEditable: true,
      tracksEditable: true,
      exportViewUrl: '/api/v1/viewconfs',
      trackSourceServers: ['http://higlass.io/api/v1'],
    };

    const hgApi = window.hgApi = await viewer(
      container,
      viewConfig,
      { bounded: true },
    );
  </script>
</html>
`,
    ),
    // for the types output
    fs.promises.copyFile(
      path.resolve(__dirname, '../package.json'),
      path.resolve(outDir, 'package.json'),
    ),
    fs.promises.copyFile(
      path.resolve(__dirname, '../app/schema.json'),
      path.resolve(outDir, 'app/schema.json'),
    ),
  ]);
}

main({ outDir: path.resolve(__dirname, '../dist') });
