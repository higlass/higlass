### Introduction

HiGlass is a web-based viewer for genome interaction maps
featuring synchronized navigation of multiple views as well as continuous zooming and panning
for navigation across genomic loci and resolutions. It supports visual comparison of
Hi-C and other genomic data from different experimental conditions and can be used to efficiently
identify salient outcomes of experimental perturbations, generate new hypotheses, and share
the results with the community.

A live instance can be found at [http://higlass.io](http://higlass.io). A [Docker container](https://github.com/hms-dbmi/higlass-docker) is available for running an instance locally, although we recommend using the [higlass-manage](https://github.com/pkerpedjiev/higlass-manage) package to start, stop and configure local instances.

For documentation about how to use and install HiGlass, please visit [http://docs.higlass.io](http://docs.higlass.io).

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

### API

HiGlass provides an API for controlling the component from within a Javascript script. Complete documentation is availabe at [docs.higlass.io](http://docs.higlass.io/higlass_developer.html#public-api). Example:

```
var testViewConfig =
{
  "editable": true,
  "trackSourceServers": [
    "http://higlass.io/api/v1"
  ],
  "exportViewUrl": "http://higlass.io/api/v1/viewconfs",
  "views": [
    {
      "uid": "view1",
      "tracks": {
        "center": [
              {
                "name": "Rao et al. (2014) GM12878 MboI (allreps) 1kb",
                "server": "http://higlass.io/api/v1",
                "tilesetUid": "CQMd6V_cRw6iCI_-Unl3PQ",
                "type": "heatmap"
              }
        ]
      },
      "genomePositionSearchBox": {
        "autocompleteServer": "http://higlass.io/api/v1",
        "chromInfoServer": "http://higlass.io/api/v1",
        "visible": true,
        "chromInfoId": "hg19",
        "autocompleteId": "OHJakQICQD6gTD7skx4EWA"
      }
    }
  ],

}


const api = hglib.createHgComponent(
    document.getElementById('development-demo'),
    testViewConfig,
    { bounded: true }
);
```
