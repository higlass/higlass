import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import genericNames from "generic-names";

import * as path from "node:path";

// Necessary have consistent hashing for `react-css-modules` and `css` modules
// https://github.com/gajus/babel-plugin-react-css-modules/issues/291
const generateScopedName = genericNames("[name]__[local]_[hash:base64:5]", {
	context: path.resolve(__dirname, "app"),
});

const babelPluginReactCssModules = [
	"react-css-modules",
	{
		generateScopedName,
		filetypes: {
			".scss": { syntax: "postcss-scss" },
		},
	},
];

export default defineConfig({
	build: {
		lib: {
			entry: path.resolve(__dirname, "app/scripts/hglib.jsx"),
			name: "hglib",
			formats: ["umd"],
		},
    rollupOptions: {
      external: ['react', 'react-dom', 'pixi.js'],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'pixi.js': 'PIXI',
        }
      }
    },
    minify: false,
	},
	plugins: [
		react({
			babel: {
				plugins: [babelPluginReactCssModules],
			},
		}),
	],
	css: {
		modules: {
			generateScopedName,
		},
	},
});
