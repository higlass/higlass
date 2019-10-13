View Configs
##########################

Viewconfs specify exactly what a HiGlass view should show. They contain a list
of the data sources, visualization types, visible region as well as searching
and styling options.

Show a specific genomic location
================================

Say we want to have a viewconf which was centered on the gene OSR1. Its
location is roughly between positions 19,500,000 and 19,600,000 on chromosome 7
of the hg19 assembly. So what should ``initialXDomain`` be set to in order to
show this gene?

Because ``initialXDomain`` accepts absolute coordinates calculated by
concatenating chromosomes according to a certain order, we need to calculate
what chr2:19,500,000 and chr2:196,000,000 are in absolute coordinates.

To do this we will assume a chromosome ordering consisting of chr1, chr2, ...
This means that we need to take the length of chr1 in hg19, which is
249,250,621 base pairs, and add our positions to that, yielding
positions 268,750,621 and 268,850,621 for the ``initialXDomain``.

The chromosome order commonly used in HiGlass for hg19 can be found in the
`negspy repository
<https://github.com/pkerpedjiev/negspy/blob/master/negspy/data/hg19/chromInfo.txt>`_.

Upload a viewconf to the server
===============================

A local viewconf can be sent to the server by sending a ``POST`` request. Make
sure the actual viewconf is wrapped in the ``viewconf`` section of the posted
json (e.g. `{"viewconf": myViewconf}`):

.. code-block:: bash

    curl -H "Content-Type: application/json" \
         -X POST \
         -d '{"viewconf": {"editable": true, "zoomFixed": false, "trackSourceServers": ["/api/v2", "http://higlass.io/api/v1"], "exportViewUrl": "/api/v1/viewconfs/", "views": [{"tracks": {"top": [], "left": [], "center": [], "right": [], "bottom": []}, "initialXDomain": [243883495.14563107, 2956116504.854369], "initialYDomain": [804660194.1747572, 2395339805.825243], "layout": {"w": 12, "h": 12, "x": 0, "y": 0, "i": "EwiSznw8ST2HF3CjHx-tCg", "moved": false, "static": false}, "uid": "EwiSznw8ST2HF3CjHx-tCg"}], "zoomLocks": {"locksByViewUid": {}, "locksDict": {}}, "locationLocks": {"locksByViewUid": {}, "locksDict": {}}, "valueScaleLocks": {"locksByViewUid": {}, "locksDict": {}}}}' http://localhost:8989/api/v1/viewconfs/

Edit the view config online
===========================

The view config can be directly adjusted in the browser to give an easy access
to all available options that might not otherwise be accessible through the
user interface yet. To open the editor click on _cog wheel_ icon in the view
header and select _Edit view config_.

The editor support a couple of keyboard shortcuts to make editing fast:

- ``CMD (or CTRL) + S `` to save and apply the view config
- ``ESC`` to claose the modl and to undue all (saved but not finalized) changes introduced while editing the view config.
- ``CMD (or CTRL) + Enter`` to save, apply, and finalize changes and close the modal
- Hold ``ALT`` for 1 second to temporarily hide the modal. The modal will reappear as soon as you release ``ALT``.

Viewconf Structure
==================

The viewconf defines which data is shown by HiGlass and how it is arranged. It
is organized into views, tracks and other metadata. This section will focus on
the root-level metadata. The sections below will delve into views and tracks.

.. code-block:: javascript

  editable: [true | false] (default: true)
  viewEditable: [true | false] (default: true)
  tracksEditable: [true | false] (default: true)

The property ``viewEditable`` specifies whether this viewconf will have a view
header and the property ``viewEditable`` determines if tracks have a context
menu. ``editable`` will force both properties to either be ``true`` or
``false``.

.. code-block:: javascript

    "trackSourceServers": [
      "http://higlass.io/api/v1",
      "http://localhost:8989/api/v1"
    ],

Where should the list of available tracks be pulled from? The field
`trackSourceServers` at the root level of the viewconf tells higlass where it
can find tracks to load. If you have a local instance running, then
`http://localhost:8989/api/v1` should be included. Our public instance at
`http://higlass.io` also provides access to a number of public datasets.


.. code-block:: javascript

    {
        "exportViewUrl": "/api/v1/viewconfs",
    }

The ``exportViewUrl`` field in the viewconf specifies which endpoint should be used
to store exported viewconfs. This endpoint stores exported viewconfs in its
database, assigns them a uid, and makes them accessible through its API at
``/api/v1/viewconfs/uid/``. The default points to a url on the same server that
is hosting the higlass application. It can also be changed to point to an
external location (i.e. 'http://higlass.my.department.com/api/v1/viewconfs').



Genome Position Search Box
^^^^^^^^^^^^^^^^^^^^^^^^^^

The genome position search box section of a viewconf is specific to each view.
It is used to search for locations in the view. The full configuration has a
pointer to a chromSizes file and an autocomplete source which will provide
suggestions for gene names. The autocomplete source should point to a `gene-
annotations` file.


Views
=====

Views are placed within the top level of the viewconf and arranged
in a list:

.. code-block:: javascript

  {
    views: [
      {
        ...
      }
    ]
  }

The rest of this section refers to elements within the individual view sections.

UIDs
^^^^

UID stands for unique identifier. Every view and track in the higlass viewconf has a UID. If it's not specified in the viewconf it's randomly
generated by the client when the view is created.

initialXDomain and initialYDomain
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The fields contain the initial coordinates which are displayed when HiGlass
first loads the viewconf. If the ``initialYDomain`` is not present, it is set
to equal the ``initialXDomain``. If that isn't present either, both are
assigned values of ``[0,1]]``.

.. code-block:: javascript

    {
        views: [
            {
                  "uid": "AhI0wMP6ScybnFp6BmLuPQ",
                  "initialXDomain": [
                    973907089.1176914,
                    1196247735.9596405
                  ],
                  "initialYDomain": [
                    -12281154450.083118,
                    -12145323104.213125
                  ],
                "genomePositionSearchBox": {
                    "autocompleteServer": "http://higlass.io/api/v1",
                    "autocompleteId": "OHJakQICQD6gTD7skx4EWA",
                    "chromInfoServer": "http://higlass.io/api/v1",
                    "chromInfoId": "hg19",
                    "visible": true
                }
        ]
    }

trackSourceServers
^^^^^^^^^^^^^^^^^^

The field `trackSourceServers` at the root level of the viewconf tells higlass
where it can find tracks to load. If you have a local instance running, then
`http://localhost:8989/api/v1` should be included. Our public instance at
`http://higlass.io` also provides access to a number of public datasets.

.. code-block:: javascript

    {
      "trackSourceServers": [
        "http://higlass.io/api/v1",
        "http://localhost:8989/api/v1"
      ],
    }

exportViewUrl
^^^^^^^^^^^^^

The ``exportViewUrl`` field in the viewconf specifies which server should be used
to store exported viewconfs. This server stores exported viewconfs in its
database, assigns them a uid, and makes them accessible through its API at
``/api/v1/viewconfs/uid/``.

.. code-block:: javascript

    {
        "exportViewUrl": "/api/v1/viewconfs",
    }

Tracks
======

Tracks can be placed into five distinct areas: top, bottom, left, right or
center. The location of the track determines what type of data can be shown in
it. Center tracks are used to show data that can be zoomed along two axes.
Horizontal (top, bottom) and vertical (left, right) are used to show data that
can be zoomed along a single axis.

Each set of tracks is placed within a view.

.. code-block:: javascript

    {
      "views": [
        {
          "tracks": {
            "top": [],
            "left": [],
            "center": [],
            "bottom": [],
            "right": []
          },
        }
      ],
    }

Track Data Sources
------------------

Tracks can load data from two sources: data stored on a higlass server,
ie, identified by a server and ``tilesetUid``, or data stored at an http-accessible
url and read through a higlass server. The latter approach is still currently
experimental.

Using ``tilesetUid``
^^^^^^^^^^^^^^^^^^^^

The normal method of retrieving data is from a higlass server using a
``tilesetUid``. The ``tilesetUid`` identifies a dataset on the server. It is
loaded using the ``ingest_tileset`` command demonstrated in the `data
preparation section <data_preparation.html>`__. To view this type of data, the
track entry in the viewconf needs to contain  ``server`` and ``tilesetUid``
entries:

.. code-block:: javascript

    {
      "type": "heatmap",
      "server": "http://higlass.io/api/v1",
      "tilesetUid": "default",
    }

Using ``fileUrl``
^^^^^^^^^^^^^^^^^

The second method of obtaining data is from a http-accessible url. We still
need a compatible server to load data from the url and convert it to tiles,
but we don't need to explicitly register the data with the server. This can be
done automatically by the client as long as it has the ``fileUrl``, ``server``
and ``filetype``

.. code-block:: javascript

    {
      "type": "vector",
      "server": "http://my-higlass.io/api/v1",
      "fileUrl": "http://hgdownload.cse.ucsc.edu/goldenpath/hg19/encodeDCC/wgEncodeSydhTfbs/wgEncodeSydhTfbsGm12878InputStdSig.bigWig",
      "filetype": "bigwig"
    }

Using ``data``
^^^^^^^^^^^^^^

In addition to using ``tilesetUid`` or ``fileUrl`` to specify a data source, the ``data`` section can be used to configure other data sources or to create data sources consisting of multiple tilesets, such as one matrix divided by another.

Genbank files
"""""""""""""

A Genbank file data source will load a complete genbank file from a remote URL and serve that as a ``gene-annotations`` datatype. See the `horizontal-gene-annotations section <track_types.html#gene-annotations>`_ for an example of a track type that can be used with Genbank files.

.. code-block:: javascript

  {
    "data": {
      "type": "genbank",
      "url": "https://pkerp.s3.amazonaws.com/public/GCA_000010365.1_ASM1036v1_genomic.gbff.gz"
    }
  }

**Note** The Genbank data sources is limited in its detail. It currently only displays genes and the names of genes. More extensive support for gene annotations (e.g. exons) should be added in the `higlass/app/scripts/data-fetchers/genbank-fetcher.js` file.

Track options
--------------

Each track can specify a set of options defining how it will be drawn.
Some of the more important ones are:

-  ``valueScaleMin`` and ``valueScaleMax``: control the minimum and maximum values rendered by the track. If either is not defined, then it will be set according to the visible data (i.e. the minimum value of the scale will be the minimum value in the visible data and the same for the maximum)

- ``showMousePosition``: enables a visual crosshair at the mouse cursor's location across the track

- ``labelLeftMargin``, ``labelRightMargin``, ``labelTopMargin``, and ``labelBottomMargin``: add a margin to the track label. The effect is identical to CSS margin, i.e., ``labelLeftMargin === 10`` will push the label 10px to the right if ``labelPosition === 'left'``.

- ``axisMargin``: sets a margin to the very end of the plot. For example, if ``axisPositionHorizontal === 'left'`` and ``axisMargin === 10`` then the axis will be drawn 10px from the left side of the track.

- ``minHeight`` and ``minWidth``: useful for tracks which are generated programmatically or otherwise edited, which have a height or width smaller than default values that may otherwise constrain rendering.

Overlay Tracks
==============

Overlay tracks can be placed over normal tracks and can span all five distinct
areas: top, bottom, left, right or center. The location of the track is
determined by the tracks it should overlay. Overlay tracks by default visualize
semi-transparent rectengles as annotations. Currently the only other type of
overlay tracks that is supported is chromosome-grid.

Each set of tracks is placed within a view under overlays. An overlay track
needs to contain an includes property. Otherwise the options depend on the type
of overlay.

The extent option for overlay-annotation tracks is an array of tuples representing
the start and end of each section that should be overlaid. The tuples can be either
2-tuple or 4-tuple. 2-tuple indicates that horizontal and vertical start and end
coordinates are the same, 4-tuple indicates that horizontal and vertical start and
end coordinates are different: [start, end] vs [x-start, x-end, y-start, y-end].

**Options:**

- ``extent`` [array] (default ``[]``)
- ``minWidth`` [number] (default ``0``)
- ``fill`` [string] (default ``blue``)
- ``fillOpacity`` [number] (default ``0.3``)
- ``stroke`` [string] (default ``blue``)
- ``strokeOpacity`` [number] (default ``1``)
- ``strokeWidth`` [number] (default ``0``)
- ``strokePos`` [string, array] (default ``undefined``, which will drawn the stroke around the entire extent)
- ``outline`` [string] (default ``white``)
- ``outlineOpacity`` [number] (default ``1``)
- ``outlineWidth`` [number] (default ``0``)
- ``outlinePos`` [string, array] (default ``undefined``, which will drawn the stroke around the entire extent)

**Example:**

.. code-block:: javascript

    {
      "views": [
        {
          "overlays": [
            {
              "uid": "overlay-annotation",
              "includes": ["track1", "track2", "track3"],
              // Default definitions for annotations
              "options": {
                "extent": [
                  [1000000000, 1100000000],
                  [1200000000, 1300000000, 1400000, 1500000]
                ],
                minWidth: 3,
                fill: "blue",
                fillOpacity: 0.3,
                stroke: "yellow",
                strokeOpacity: 0.6,
                strokeWidth: 2,
                strokePos: ["left", "right"],
                outline: "cyan"
                outlineOpacity: 0.1337,
                outlineWidth: 1337,
                outlinePos: "top"
              }
            },
            {
              "uid": "overlay-chromosome-grid",
              "includes": ["track1", "track2", "track3"],
              "type": "chromosome-grid",
              // Same definitions as the chromosome-grid track
              "chromInfoPath": "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
              "options": {
                "lineStrokeWidth": 1,
                "lineStrokeColor": "grey"
              }
            }
          ]
        }
      ],
    }
