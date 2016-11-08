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
<div id="higlass-component" style="width: 400px;"></div>

<script src='scripts/higlass.js'></script>
<script type="text/javascript">
var rectangularOneWindow = JSON.parse(`
{"views":
    [
      {
        "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromInfo.txt",
        "domain": [
          0,
          3000000000
        ],
        "viewStyle": {
          "float": "left",
          "padding": "5px",
          "width": "100%"
        },
        "tracks": [
            {
            "source": "//52.23.165.123:9872/hg19.1/Rao2014-GM12878-MboI-allreps-filtered.1kb.cool.reduced.genome.gz",
            "type": "heatmap",
            "height": 300
          }
        ]
      }
    ],
    "editable": true
}
`)


higlass.HiGlassContainer('higlass-component', JSON.stringify(rectangularOneWindow));

</script>

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

