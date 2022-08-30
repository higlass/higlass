import * as esbuild from 'esbuild';
import * as React from 'react';
import * as PIXI from 'pixi.js';

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// =========================================
//         rename vite outputs
// =========================================

await Promise.all([
  fs.promises.rename(
    path.resolve(__dirname, '../dist/higlass.umd.js'),
    path.resolve(__dirname, '../dist/hglib.js'),
  ),
  fs.promises.rename(
    path.resolve(__dirname, '../dist/style.css'),
    path.resolve(__dirname, '../dist/hglib.css'),
  ),
]);

// =========================================
//        minify (dist/hglib.min.js)
// =========================================

await esbuild.build({
  entryPoints: [path.resolve(__dirname, '../dist/hglib.js')],
  minify: true,
  outfile: path.resolve(__dirname, '../dist/hglib.min.js'),
});

// =========================================
//       UMD demo (dist/index.html)
// =========================================

const esmHTML = await fs.promises.readFile(
  path.resolve(__dirname, '../index.html'), { encoding: 'utf-8' },
);

const base = "https://unpkg.com";
const reactVersion = React.version.split('.')[0];
const pixiVersion = PIXI.VERSION.split('.')[0];

await fs.promises.writeFile(
  path.resolve(__dirname, '../dist/index.html'),
  // replace module higlass import with UMD scripts
  esmHTML.replace(/<!-- HIGLASS IMPORT -->(.|\n)*<!-- HIGLASS IMPORT -->/, `\
    <link rel="stylesheet" href="./hglib.css">
    <script src="${base}/react@${reactVersion}/umd/react.production.min.js"></script>
    <script src="${base}/react-dom@${reactVersion}/umd/react-dom.production.min.js"></script>
    <script src="${base}/pixi.js@${pixiVersion}/dist/browser/pixi.min.js"></script>
    <script src="./hglib.min.js"></script>
  `)
);
