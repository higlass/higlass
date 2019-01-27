[![Build Status](https://travis-ci.org/higlass/higlass.svg?branch=master)](https://travis-ci.org/higlass/higlass)
[![Live Docs](https://img.shields.io/badge/docs-live-red.svg?colorB=0f5d92)](https://docs.higlass.io/)
[![DOI](https://zenodo.org/badge/56026057.svg)](https://zenodo.org/badge/latestdoi/56026057)
[![Slack](https://now-examples-slackin-zukqykuatj.now.sh/badge.svg)](https://now-examples-slackin-zukqykuatj.now.sh/)


### Introduction

HiGlass is a web-based viewer for genome interaction maps
featuring synchronized navigation of multiple views as well as continuous zooming and panning
for navigation across genomic loci and resolutions. It supports visual comparison of
Hi-C and other genomic data from different experimental conditions and can be used to efficiently
identify salient outcomes of experimental perturbations, generate new hypotheses, and share
the results with the community.

A live instance can be found at [http://higlass.io](http://higlass.io). A [Docker container](https://github.com/higlass/higlass-docker) is available for running an instance locally, although we recommend using the [higlass-manage](https://github.com/pkerpedjiev/higlass-manage) package to start, stop and configure local instances.

For documentation about how to use and install HiGlass, please visit [http://docs.higlass.io](http://docs.higlass.io).

### Citation

Kerpedjiev, P., Abdennur, N., Lekschas, F., McCallum, C., Dinkla, K., Strobelt, H., ... & Gehlenborg, N. *HiGlass: Web-based Visual Exploration and Analysis of Genome Interaction Maps.* Genome Biology (2018): 19:125. https://doi.org/10.1186/s13059-018-1486-1

### Example

<p align="center">
  <img src="https://cloud.githubusercontent.com/assets/2143629/24535936/37ee60ee-15a5-11e7-89aa-434d93cda91d.gif" />
</p>

### Development

To run higlass from its source code simply run the following:

```
npm install
npm run start
```

This starts a server in development mode at http://localhost:8080/.
A [full list](http://localhost:8080/examples.html) of examples is available.

### Tests

The tests for the React components and API functions are located in the `test` directory. To save time and only run relevant tests, open `karma.conf.js` and select the test files to run before running `test-watch`.

```
npm run test-watch
```

**Troubleshooting:**

- If the installation fails due to `sharp` > `node-gyp` try installing the node packages using `python2`:

  ```
  npm i --python=/usr/bin/python2 && rm -rf node_modules/node-sass && npm i
  ```

### API

HiGlass provides an API for controlling the component from within a Javascript script. Complete documentation is availabe at [docs.higlass.io](http://docs.higlass.io/higlass_developer.html#public-api). Example:

```
<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" type="text/css">
<link rel="stylesheet" href="https://unpkg.com/higlass@1.0.1/dist/styles/hglib.css" type="text/css">

<script src="https://cdnjs.cloudflare.com/ajax/libs/react/15.6.2/react.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/15.6.2/react-dom.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/4.6.2/pixi.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-bootstrap/0.31.0/react-bootstrap.min.js"></script>
<script src="https://unpkg.com/higlass@1.0.1/dist/scripts/hglib.js"></script>

<div
    id="development-demo"
    style="position: absolute; left: 1rem; top: 1rem; bottom: 1rem; right: 1rem">
</div>

<script>
const api = hglib.createHgComponent(
    document.getElementById('development-demo'),
    'http://higlass.io/api/v1/viewconfs/?d=default',
    { bounded: true }
);
</script>
```
### Related

[![diagram of related tools](https://docs.google.com/drawings/d/e/2PACX-1vSCiCzfQ8FEyHPFSq7jJD6XmzC760xH1Zr4FIcCMzFmqAlrmYEBMId8gM42uz0okmvuEaxetyPPZ9VG/pub?w=600&h=450)](https://docs.google.com/drawings/d/1Xedi5ZRtbRdt2g20qpl_lWs4BMqc2DKZ2ZOoJvpHw9U/edit)

* [HiGlass Manage](https://github.com/higlass/higlass-manage) - Easy to use interface for deploying a local HiGlass instance
* [HiGlass Docker](https://github.com/higlass/higlass-docker) - Build an image containing all the components necessary to deploy HiGlass
* [HiGlass Server](https://github.com/higlass/higlass-server) - Server component for serving multi-resolution data
* [HiGlass App](https://github.com/higlass/higlass-app) - The code for the web application hosted at http://higlass.io

### License

HiGlass is provided under the MIT License.
