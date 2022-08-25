import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import genericNames from "generic-names";

import * as path from "node:path";
import { version } from "./package.json";

// Necessary have consistent hashing for `react-css-modules` and `css` modules
// https://github.com/gajus/babel-plugin-react-css-modules/issues/291
const generateScopedName = genericNames("[name]__[local]_[hash:base64:5]", {
	context: path.resolve(__dirname, "app"),
});

// Babel plugin which enables use of `styleNames` in JSX
const reactCssModules = [
	"react-css-modules",
	{
		generateScopedName,
		filetypes: {
			".scss": { syntax: "postcss-scss" },
		},
	},
];

export default defineConfig({
	root: path.resolve(__dirname, "app"),
	build: {
		lib: {
			entry: path.resolve(__dirname, "app/scripts/hglib.jsx"),
			name: "hglib",
			formats: ["umd"],
		},
		rollupOptions: {
			external: ["react", "react-dom", "pixi.js"],
			output: {
				globals: {
					"react": "React",
					"react-dom": "ReactDOM",
					"pixi.js": "PIXI",
				},
			},
		},
		minify: false,
	},
	define: {
		XYLOPHON: JSON.stringify(version),
	},
	css: {
		modules: { generateScopedName },
	},
	plugins: [
		react({ babel: { plugins: [reactCssModules] } }),
	],
});
