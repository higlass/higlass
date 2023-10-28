// @ts-nocheck
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

await vite.build({
  configFile: path.resolve(__dirname, '../vite.config.mjs'),
  build: {
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

// Input HTML that needs imports to be replaced
const inputHTML = await fs.promises.readFile(
  path.resolve(__dirname, '../index.html'),
  { encoding: 'utf-8' },
);

// =========================================
//     rename styles generated by Vite
// =========================================

await fs.promises.rename(
  path.resolve(__dirname, '../dist/style.css'),
  path.resolve(__dirname, '../dist/hglib.css'),
);

// =========================================
//  prod (un)minified UMD (hglib/hglib.min)
// =========================================
{
  // Transform the contents of the vite build
  const viteUmdOutput = path.resolve(__dirname, '../dist/higlass.umd.js');

  // 1.) Transpile the code to ES5 (see https://github.com/higlass/higlass/pull/1141#issue-1561403774)
  const transpiled = await babel.transformFileAsync(viteUmdOutput, {
    plugins: ['@babel/plugin-transform-classes'],
  });

  // 2.) Write the unminified UMD to disk
  await fs.promises.writeFile(
    path.resolve(__dirname, '../dist/hglib.js'),
    transpiled.code,
  );

  // 3.) Minify the UMD and write it to disk
  const minifed = await esbuild.transform(transpiled.code, {
    minify: true,
  });

  await fs.promises.writeFile(
    path.resolve(__dirname, '../dist/hglib.min.js'),
    minifed.code,
  );

  // 4.) Delete the vite UMD input that we have the final UMDs
  await fs.promises.unlink(viteUmdOutput);

  // 5.) Prepare the associated HTML file
  await fs.promises.writeFile(
    path.resolve(__dirname, '../dist/index.html'),
    // replace module higlass import with UMD scripts
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
}

// =========================================
//              Prepare ESM
// =========================================
{
  const viteESMOutput = path.resolve(__dirname, '../dist/higlass.mjs');

  // 1.) Transpile the code to ES5 (see https://github.com/higlass/higlass/pull/1141#issue-1561403774)
  const transpiled = await babel.transformFileAsync(viteESMOutput, {
    plugins: ['@babel/plugin-transform-classes'],
  });

  // 2.) Overwrite the vite ESM input with the transpiled code
  await fs.promises.writeFile(viteESMOutput, transpiled.code);

  // 3.) Prepare the associated HTML file
  await fs.promises.writeFile(
    path.resolve(__dirname, '../dist/esm.html'),
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
}
