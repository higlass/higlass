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
- ``ESC`` to close the modal and to undo all (saved but not finalized) changes introduced while editing the view config.
- ``CMD (or CTRL) + Enter`` to save, apply, and finalize changes and close the modal
- Hold ``ALT`` for 1 second to temporarily hide the modal. The modal will reappear as soon as you release ``ALT``.

For example, here is a recipe for **fixing heatmap value scale limits** which is useful when browsing Hi-C data with a linear color scale because of its very high dynamic range. First, locate the description of the heatmap track you want to edit and find the options dictionary.

.. code-block:: json

  {
  ...
  "type": "heatmap",
  "options": {
      "name": "My Hi-C map",
      ...
      "heatmapValueScaling": "log",
      "showMousePosition": false,
      ...
  },
  ...
  }


Then set ``heatmapValueScaling`` to ``"linear"`` if not set already and add two additional entries: ``valueScaleMin`` and ``valueScaleMax``.

.. code-block:: json

  {
  ...
  "type": "heatmap",
  "options": {
      "name": "My Hi-C map",
      ...
      "heatmapValueScaling": "linear",
      "valueScaleMin": 0.0,
      "valueScaleMax": 0.02,
      "showMousePosition": false,
      ...
  },
  ...
  }

Finally, save to apply the changes.


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

.. code-block:: javascript

      "genomePositionSearchBox": {
        "autocompleteServer": "//higlass.io/api/v1",
        "autocompleteId": "QDutvmyiSrec5nX4pA5WGQ",
        "chromInfoServer": "//higlass.io/api/v1",
        "chromInfoId": "mm10",
        "visible": true
      },

This will pull the chromosome sizes and autocomplete annotations
for a higlass server. One can also tell the genome position search box to use chromosome files from an absolute location. This option would most often be used with the `hideAvailableAssemblies` option to hide the dropdown of available assemblies:

.. code-block:: javascript

      "genomePositionSearchBox": {
        "chromInfoPath": 'https://s3.amazonaws.com/pkerp/public/gpsb/small.chrom.sizes',
        "hideAvailableAssemblies": true,
        "visible": true
      },


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

zoomLimits
^^^^^^^^^^

The field contains limits that controll the extend to which zooming is possible within a view. In the example below, zooming in is not possible beyond 200bp. If one of the items in the array is `null`, zooming is unrestricted in the corresponding direction. If the field is not present in the viewconf, it defaults to `[1, null]`.

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
                  "zoomLimits": [
                    200,
                    3400000000
                  ],
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

zoomLocks
^^^^^^^^^

In HiGlass, the zoom and location of multiple views can be synchronized for 
concurrent analysis. The ``zoomLocks`` field in the viewconf specifies which views
should be synchronized in terms of the zoom level. For example, the following 
configuration locks the zoom level of two views:

.. code-block:: javascript

    "zoomLocks": {
      "locksByViewUid": {
        "view-1": "lock-1",
        "view-2": "lock-1",
      },
      "locksDict": {
        "lock-1": {
          "view-1": [
            1550000000,
            1550000000,
            3380588.876772046
          ],
          "view-2": [
            1550000000.0000002,
            1549999999.9999993,
            3380588.876772046
          ],
          "uid": "lock-1"
        }
      }
    }

locationLocks
^^^^^^^^^^^^^

The ``locationLocks`` field specifies which views should be synchronized in terms of
the location of views. This is similar to ``zoomLocks`` excepts that this field cares
about the location instead of a zoom level. The following configuration locks the 
location of two views:

.. code-block:: javascript

    "locationLocks": {
      "locksByViewUid": {
        "view-1": "lock-1",
        "view-2": "lock-1",
      },
      "locksDict": {
        "lock-1": {
          "view-1": [
            1550000000,
            1550000000,
            3380588.876772046
          ],
          "view-2": [
            1550000000.0000002,
            1549999999.9999993,
            3380588.876772046
          ],
          "uid": "lock-1"
        }
      }
    }

Using this configuration, both the horizontal and vertical axes in a view 
(``"view-1"``) are locked with the horizontal and vertical axes of another
(``"view-2"``). For a more complex use case, HiGlass also enables to lock 
certain axis between views:

.. code-block:: javascript

    "locationLocks": {
      "locksByViewUid": {
        "view-1": { "x": { "lock": "lock-1", "axis": "y" } },  
        "view-2": { "y": { "lock": "lock-1", "axis": "x" } }, 
      },
      "locksDict": {
        "lock-1": {
          "view-1": [...],
          "view-2": [...],
          "uid": "lock-1"
        }
      }
    }

In this case, only the x-axis of ``"view-1"`` will be locked with the y-axis 
of ``"view-2"``.

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

Using ``data``
^^^^^^^^^^^^^^

In addition to using ``tilesetUid`` to specify a data source, the ``data`` section can be used to configure other data sources or to create data sources consisting of multiple tilesets, such as one matrix divided by another.


Genbank files
"""""""""""""

A Genbank file data source will load a complete genbank file from a either text or remote URL and serve that as a ``gene-annotations`` datatype. See the `horizontal-gene-annotations section <track_types.html#gene-annotations>`_ for an example of a track type that can be used with Genbank files.

.. code-block:: javascript

  {
    "data": {
      "type": "genbank",
      "url": "https://pkerp.s3.amazonaws.com/public/GCA_000010365.1_ASM1036v1_genomic.gbff.gz"
    }
  }

The specify the Genbank as text, replace the ``url`` field with ``text``:

.. code-block:: javascript

  {
    "data": {
      "type": "genbank",
      "text": "LOCUS       AP009180              159662 bp    DNA..."
    }
  }


**Note** The Genbank data sources is limited in its detail. It currently only displays genes and the names of genes. More extensive support for gene annotations (e.g. exons) should be added in the `higlass/app/scripts/data-fetchers/genbank-fetcher.js` file.


Other files
""""""""""""""""

The second method of obtaining data is from a http-accessible url. We still
need a compatible server to load data from the url and convert it to tiles,
but we don't need to explicitly register the data with the server. This can be
done automatically by the client as long as it has an object with the ``url``, ``server``
and ``filetype`` properties in the ``data`` property of the track config.

.. code-block:: javascript

    {
      "type": "vector",
      "server": "http://my-higlass.io/api/v1",
      "url": "http://hgdownload.cse.ucsc.edu/goldenpath/hg19/encodeDCC/wgEncodeSydhTfbs/wgEncodeSydhTfbsGm12878InputStdSig.bigWig",
      "filetype": "bigwig"
    }

**Note** We do not provide a compatible server "out of the box" or as part of the higlass-manage / higlass-docker distribution. To use this functionality, you have to run ``higlass-server`` directly and `mount the http and httpfs directories a filesystems in userspace <https://github.com/higlass/higlass-server/blob/develop/start.sh>`_.


Raw tile values
"""""""""""""""

We can bypass the file format and specify raw tile values using a ``local-tiles`` data fetcher. This data fetcher has to specify ``type: "local-tiles"`` and provide the ``tilesetInfo`` and ``tiles`` values. In the example below the value ``OHJakQICQD6gTD7skx4EWA`` is the equivalent of the tilesetUid used in a regular remote tile fetcher. It's not actually used by the local tile fetcher here but it is expected to make it easy to copy and paste actual network tile requests. Because the value is not used, any string can be passed in.

.. code-block:: javascript

  data: {
    type: 'local-tiles',
    tilesetInfo: {
      OHJakQICQD6gTD7skx4EWA: {
        zoom_step: 1,
        max_length: 3137161264,
        assembly: 'hg19',
        chrom_names:
          'chr1\tchr2\tchr3\tchr4\tchr5\tchr6\tchr7\tchr8\tchr9\tchr10\tchr11\tchr12\tchr13\tchr14\tchr15\tchr16\tchr17\tchr18\tchr19\tchr20\tchr21\tchr22\tchrX\tchrY\tchrM',
        chrom_sizes:
          '249250621\t243199373\t198022430\t191154276\t180915260\t171115067\t159138663\t146364022\t141213431\t135534747\t135006516\t133851895\t115169878\t107349540\t102531392\t90354753\t81195210\t78077248\t59128983\t63025520\t48129895\t51304566\t155270560\t59373566\t16571',
        tile_size: 1024.0,
        max_zoom: 22,
        max_width: 4294967296.0,
        min_pos: [1],
        max_pos: [3137161264],
        header: '',
        name: 'Gene Annotations (hg19)',
        datatype: 'gene-annotation',
        coordSystem: 'hg19',
        coordSystem2: ''
      }
    },
    tiles: {
      'OHJakQICQD6gTD7skx4EWA.16.20101': [
        {
          xStart: 1317244685,
          xEnd: 1317481244,
          chrOffset: 1233657027,
          importance: 111.0,
          uid: 'WepfdWoIS9qSTmH9r9QUuQ',
          fields: [
            'chr7',
            '83587658',
            '83824217',
            'SEMA3A',
            '111',
            '-',
            'union_10371',
            '10371',
            'protein-coding',
            'semaphorin 3A',
            '83590686',
            '83823902',
            '83587658,83592520,83606447,83610636,83614751,83631270,83634654,83636668,83640337,83640498,83643524,83675639,83689780,83739785,83758438,83764109,83823790',
            '83591142,83592663,83606512,83610794,83614793,83631362,83634874,83636813,83640407,83640613,83643667,83675759,83689874,83739905,83758501,83764267,83824217'
          ]
        }
      ]
    }
  },

Divided Tracks
""""""""""""""

The ``data`` section a track's definition can be used to sepcify that the track should display the ratio of two datasets:

.. code-block:: javascript

  "data": {
    "type": "divided",
    "children": [
      {
        "server": "//higlass.io/api/v1",
        "tilesetUid": "H7e9Cj97SziKnltNM9pWNw"
      },
      {
        "server": "//higlass.io/api/v1",
        "tilesetUid": "Ay0kiiScSoOYKcSGKH4jjQ"
      }
    ]
  }

Track options
--------------

Each track can specify a set of options defining how it will be drawn.
Some of the more important ones are:

-  ``valueScaleMin`` and ``valueScaleMax``: control the minimum and maximum values rendered by the track. If either is not defined, then it will be set according to the visible data (i.e. the minimum value of the scale will be the minimum value in the visible data and the same for the maximum)

- ``showMousePosition``: enables a visual crosshair at the mouse cursor's location across the track

- ``labelLeftMargin``, ``labelRightMargin``, ``labelTopMargin``, and ``labelBottomMargin``: add a margin to the track label. The effect is identical to CSS margin, i.e., ``labelLeftMargin === 10`` will push the label 10px to the right if ``labelPosition === 'left'``.

- ``axisMargin``: sets a margin to the very end of the plot. For example, if ``axisPositionHorizontal === 'left'`` and ``axisMargin === 10`` then the axis will be drawn 10px from the left side of the track.

- ``minHeight`` and ``minWidth``: useful for tracks which are generated programmatically or otherwise edited, which have a height or width smaller than default values that may otherwise constrain rendering.

- ``labelShowResolution``: determines whether resolution information (for example, the text ``[Current data resolution: 4.096M]``) is included in the track label

- ``labelShowAssembly``: determines whether genome assembly information (for example, the prefix ``hg19 | ``) is included in the track label

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
      views: [
        {
          overlays: [
            {
              uid: 'overlay-annotation',
              includes: ['track1Uid', 'track2Uid', 'track3Uid'],
              // Default definitions for annotations
              options: {
                extent: [
                  [1000000000, 1100000000],
                  [1200000000, 1300000000, 1400000, 1500000]
                ],
                minWidth: 3,
                fill: 'blue',
                fillOpacity: 0.3,
                stroke: 'yellow',
                strokeOpacity: 0.6,
                strokeWidth: 2,
                strokePos: ['left', 'right'],
                outline: 'cyan',
                outlineOpacity: 0.1337,
                outlineWidth: 1.337,
                outlinePos: 'top'
              }
            },
            {
              uid: 'overlay-chromosome-grid',
              includes: ['track1', 'track2', 'track3'],
              type: 'chromosome-grid',
              // Same definitions as the chromosome-grid track
              chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
              options: {
                lineStrokeWidth: 1,
                lineStrokeColor: 'grey'
              }
            }
          ]
        }
      ],
    }
