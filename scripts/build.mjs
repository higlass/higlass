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
import * as babel from '@babel/core';

import * as React from 'react';
import * as PIXI from 'pixi.js';

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
 * @returns {Promise<{ umd: string, minifiedUmd: string, esm: string, css: string }>}
 */
async function build() {
  const viteBuildResult = await vite.build({
    configFile: path.resolve(__dirname, '../vite.config.mjs'),
    build: {
      write: false,
      minify: false,
      lib: {
        entry: path.resolve(__dirname, '../app/scripts/hglib.jsx'),
        name: 'hglib',
        formats: ['umd', 'es'],
      },
      rollupOptions: {
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
  });

  const expected = collectExpectedViteBuildOutputs(viteBuildResult, [
    'higlass.umd.js',
    'higlass.mjs',
    'style.css',
  ]);

  const transpiledUmd = await babel.transformAsync(expected['higlass.umd.js'], {
    plugins: ['@babel/plugin-transform-classes'],
  });

  const transpiledEsm = await babel.transformAsync(expected['higlass.mjs'], {
    plugins: ['@babel/plugin-transform-classes'],
  });

  if (!transpiledUmd?.code || !transpiledEsm?.code) {
    throw new Error('Could not transpile UMD or ESM');
  }

  const minifiedTranspiledUmd = await esbuild.transform(transpiledUmd.code, {
    minify: true,
  });

  return {
    umd: transpiledUmd.code,
    minifiedUmd: minifiedTranspiledUmd.code,
    esm: transpiledEsm.code,
    css: expected['style.css'],
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
    fs.promises.writeFile(path.resolve(outDir, 'hglib.css'), bundle.css),
    // UMD
    fs.promises.writeFile(path.resolve(outDir, 'hglib.js'), bundle.umd),
    fs.promises.writeFile(
      path.resolve(outDir, 'hglib.min.js'),
      bundle.minifiedUmd,
    ),
    fs.promises.writeFile(
      path.resolve(outDir, 'index.html'),
      await generateHTML(`\
    <link rel="stylesheet" href="./hglib.css">
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
    <link rel="stylesheet" href="./hglib.css">
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
    </script>
  `),
    ),
  ]);
}

main({ outDir: path.resolve(__dirname, '../dist') });
