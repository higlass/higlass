import * as esbuild from 'esbuild';
import * as vite from 'vite';
import * as babel from '@babel/core';
import * as React from 'react';
import * as PIXI from 'pixi.js';

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const REACT_VERSION = React.version.split('.')[0];
const PIXI_VERSION = PIXI.VERSION.split('.')[0];

const inputHTML = await fs.promises.readFile(
  path.resolve(__dirname, '../index.html'),
  { encoding: 'utf-8' },
);

/**
 * @template {string} T
 * @param {Awaited<ReturnType<typeof vite.build>>} buildResult
 * @param {ReadonlyArray<T>} filenames
 * @returns {{ [K in T]: string }}
 */
function collectViteBuildOutputs(buildResult, filenames) {
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

  const { 'higlass.umd.js': umd, 'higlass.mjs': esm, 'style.css': css } = collectViteBuildOutputs(
    viteBuildResult,
    ['higlass.umd.js', 'higlass.mjs', 'style.css'],
  );

  const transpiledUmd = await babel.transformAsync(umd, {
    plugins: ['@babel/plugin-transform-classes'],
  });

  const transpiledEsm = await babel.transformAsync(esm, {
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
    css,
  }
}

const bundle = await build();
const out = path.resolve(__dirname, '../dist');
await fs.promises.mkdir(out, { recursive: true });
await fs.promises.writeFile(path.resolve(out, 'hglib.js'), bundle.umd);
await fs.promises.writeFile(path.resolve(out, 'hglib.min.js'), bundle.minifiedUmd);
await fs.promises.writeFile(path.resolve(out, 'higlass.mjs'), bundle.esm);
await fs.promises.writeFile(path.resolve(out, 'hglib.css'), bundle.css);
await fs.promises.writeFile(
  path.resolve(out, 'index.html'),
  inputHTML.replace(
    /<!-- HIGLASS IMPORT -->(.|\n)*<!-- HIGLASS IMPORT -->/,
    `\
    <link rel="stylesheet" href="./hglib.css">
    <script src="https://unpkg.com/react@${REACT_VERSION}/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@${REACT_VERSION}/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/pixi.js@${PIXI_VERSION}/dist/browser/pixi.min.js"></script>
    <script src="./hglib.min.js"></script>
  `,
  ),
);
await fs.promises.writeFile(
  path.resolve(out, 'esm.html'),
  inputHTML.replace(
    /<!-- HIGLASS IMPORT -->(.|\n)*<!-- HIGLASS IMPORT -->/,
    `\
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
  `,
  ),
);
