=======================
HiGlass Track Types
=======================

Bed-like
=================

.. image:: img/bedlike-track-thumb.png
    :align: right

The bedlike track is intended to display generic interval data. It is used to
render tracks with a `bedlike` datatype. This usually comes from the `beddb`
filetype.

Gene-annotations
================

.. image:: img/gene-annotations-track-thumb.png
    :align: right

Gene annotations display the locations of genes and their exons and introns.
The tracks displayed on HiGlass show a transcript consisting of the union of
all annotated exons in refseq. There are separate tracks for the different
available species. Details on how gene annotation tracks are created is available
in the `gene annotations section <gene_annotations.html>`_.

Heatmap
=======

.. image:: img/heatmap-track-thumb.png
    :align: right

Heatmaps in HiGlass are usually used to display HiC data. They log-scale input
values and map them to a user-selectable color scale (color map configuration
option). Because HiGlass displays data at varying zoom levels, heatmaps are
displayed at different resolutions depending on the current zoom level. To 
limit the resolution of the displayed data, users can set the `Zoom Limit`
configuration option.
