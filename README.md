# Goomba

Display zoomable gene annotations.

First genes need to be annotated with an importance and then partitiioned
into tiles. The visual layer can then decide how to display them.

## Search Field

Goomba provides a search field for zooming into locations on the genome. Its semantics
are best described by way of example.

* `chr1`
    - Move viewing area to encompass all of `chr1`
* `chr1:10000`
    - Center viewing are at nucleotide 10000 of chr1. Zoom in to the highest zoom level.
* `chr1:100 to chr1:200`
    - Show the whole region between `chr1:100` and `chr1:200`
* `chr1 to chr1:1000`
    - Show the region between the start of chr1 and chr1:1000
* `chr1:1000 to chr1`
    - ???? Hard to say. Probably ignore the lonely `chr1` and center on chr1:1000
* `chr1:1000 to chr2`
    - Region between chr1:1000 and the start of chr2
* `chr1 and chr2`
    - Show chr1 on x-axis and chr2 on y-axis. If the viewer is 1D, then only show the region encompassing chr1
