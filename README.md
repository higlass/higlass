### Introduction

`HiGlass` is a tool for displaying a large scale view of Hi-C data. It strives to
create a seamless interface for zooming and exploration of massive 2D genomic
data sets.

## Live Example

A live example can be found [here](http://hms-dbmi.github.io/higlass/).

## Code Sample

The following code shows how to instantiate a `HiGlass` container and use it to displya
a set of pre-generated tiles hosted on AWS S3 bucket.

```
let width = 650, height=400;

let mmvPlot = higlass.MassiveMatrixPlot()
    .width(width)
    .height(height);

d3.json('http://pkerp.s3-website-us-east-1.amazonaws.com/tiles/chr1_5kb/tile_info.json', function(error, tile_info) {
    //console.log('tile_info:', tile_info);
    mmvPlot.minX(tile_info.min_pos[0])
        .maxX(tile_info.max_pos[0])
        .minY(tile_info.min_pos[1])
        .maxY(tile_info.max_pos[1])
        .maxZoom(tile_info.max_zoom)
        .tileDirectory('http://pkerp.s3-website-us-east-1.amazonaws.com/tiles/chr1_5kb')
        .zoomCallback(zoomCallback);

    d3.select('#mmv-area')
        //.datum(data)
        .call(mmvPlot)
});
```

## Tile Generation

See the [Clodius](https://github.com/hms-dbmi/clodius) repository for information about how
contact matrix files are broken up into tiles for display using `HiGlass`.

## Screenshots

These screenshots show the `HiGlass` container embedded within a web page and
displaying [Hi-C data from chromosome 1 of the human
genome](http://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE63525).  Clicking
either of the screenshots will take you to a live example of the `HiGlass`
container being used to display this.

Low resolution:

<a href="http://hms-dbmi.github.io/higlass/"><img src="https://raw.githubusercontent.com/hms-dbmi/4DN_matrix-viewer/develop/doc/img/higlass_screenshot1.png" width=600></img></a>

High resolution:

<a href="http://hms-dbmi.github.io/higlass/"><img src="https://raw.githubusercontent.com/hms-dbmi/4DN_matrix-viewer/develop/doc/img/higlass_screenshot2.png" width=600></img></a>

## Development

To work on the source code or to see a live example, simple clone the
repository and run the following commands:

```
npm install
gulp serve
```
