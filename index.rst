==========================================
HiGlass: A Multiscale Genomic Data Browser
==========================================

`HiGlass <higlass.io>`_ is a viewer for large-scale genomic data. It takes
ideas introduced in genome browsers such as the `UCSC Genome Browser
<https://genome.ucsc.edu/>`_ and combines them with inspirations from more
recent HiC data browsers such as `Juicebox
<http://www.aidenlab.org/juicebox/>`_ and implements them in a framework
inspired by modern online maps (so-called `slippy maps
<http://wiki.openstreetmap.org/wiki/Slippy_Map>`_) to form a fast, extensible
and responsive viewer for diverse types of genomic data.

Track types
~~~~~~~~~~~

HiGlass supports both 1D and 2D track types that can be arranged in views to show desired
combinations of data.

.. raw:: html

    <div style="display: flex; align-items: center; justify-content: center; flex-wrap: wrap">

.. figure:: img/bedlike-track-thumb.png
    :height: 72px
    :align: center
    :figwidth: 100px
    
    Bed-like intervals

.. figure:: img/gene-annotations-track-thumb.png
    :height: 72px
    :align: center
    :figwidth: 100px

    Gene annotations

.. figure:: img/chromosome-labels-thumb.png
    :align: center
    :figwidth: 100px

    Chromosome labels

.. figure:: img/line-track-thumb.png
    :align: center
    :figwidth: 100px

    Line

.. figure:: img/point-track-thumb.png
    :align: center
    :figwidth: 100px

    Point

.. figure:: img/horizontal-heatmap-thumb.png
    :align: center
    :figwidth: 100px

    Horizontal heatmap

.. figure:: img/horizontal-2d-rectangle-domains-thumb.png
    :align: center
    :figwidth: 100px

    Horizontal rectangle domains

.. figure:: img/heatmap-track-thumb.png
    :height: 72px
    :align: center
    :figwidth: 100px

    Heatmap

.. figure:: img/chromosome-grid-thumb.png
    :height: 72px
    :align: center
    :figwidth: 100px

    Chromosome grid



.. raw:: html

    </div>

It can be used to display a variety of `track types <track_types.html>`_ populated with data from
different file formats.

.. figure:: img/higlass-heatmap-screenshot.png
    :align: right
    :figwidth: 300px
    
    A screenshot of HiGlass displaying a Hi-C contact matrix along with tracks
    for gene annotations chromosome labels.

.. figure:: img/higlass-dual-genome-browser-screenshot.png
    :align: right
    :figwidth: 300px
    
    A screenshot of HiGlass displaying a context-detail type view of two
    regions of the mouse genome. The locations of the two detail regions on the
    bottom are highlighted in the context view on top.

Influences
~~~~~~~~~~

As with most other pursuits, software is an iterative process. Our work does
not exist in a vacuum, nor was it developed completely independently. We owe an
enormous debt of gratitude to our ideological forebearers who have doubtlessly
tried many ideas and stuck with the ones that worked for them.

- `Juicebox <http://www.aidenlab.org/juicebox/>`_ - software for viewing Hi-C
  contact matrices 

- `UCSC Genome Browser <http://genome.ucsc.edu/>`_ - one of the first tools for
  viewing genomic data along a scrollable and zoomable axis

- `Slippy maps <http://wiki.openstreetmap.org/wiki/Slippy_Map>`_ - commonly
  referred to as "Google Maps" style maps, the technology for online maps went
  through a rapid transformation with the introduction of tile-based rendering
  and draggable scrolling.

Technology
~~~~~~~~~~

HiGlass is built with a variety of different open source components. The most
crucial are listed below.

- `D3.js <https://d3js.org/>`_ - an outstanding library for online data
  visualization. We make heavy use of D3's `scales
  <https://github.com/d3/d3-scale>`_, `zoom behavior
  <https://github.com/d3/d3-zoom>`_ and `brush behavior
  <https://github.com/d3/d3-brush>`_.

- `Pixi.js <http://www.pixijs.com/>`_ - a fast, easy to use and most
  importantly, well-documented library for drawing scene graphs on html
  canvases. Oh, and it has WebGL support. We use Pixi to quickly render track
  data and perform updates on zooming and panning.

- `React <https://facebook.github.io/react/>`_ - a widely used library for
  managing state within web applications. We use React to manage the
  user-interface components and lay out the positions of the views and tracks.

.. toctree::
    :hidden:
    :glob:

    *
