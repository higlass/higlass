Server
======

.. toctree::
    :maxdepth: 2
    :caption: Contents:

Configuration
-------------

The HiGlass server accepts a number of options to customize its use.
Some of these options are set using environment variables before the
server is started:

.. code-block:: bash

    export OPTION=value; python manage.py runserver

``APP_BASEPATH`` - Allow access to the admin interface at ``http://server.com/$APP_BASEPATH/admin``. 

``BASE_DIR`` - Set the Django base directory. This is where Django will

look for the database and the media directories.

``REDIS_HOST`` - The host name for the redis server to use for tile caching.  If
it's not specified, then no in-memory tile caching will be performed.

``REDIS_PORT`` - The port for redis server to use for tile caching. If it's not
set and a host is provided, the default port will be used.

Additionally, the following settings are set via ``config.json`` (see ``config.json.sample`` as an example):

``DEBUG`` - If ``true`` the server is started in debug mode.

``INSTALLED_APPS`` - A list of django extensions.

``LOG_LEVEL_CONSOLE`` - Define the console log level.

``LOG_LEVEL_FILE`` - Define the file log level.

``LOG_LEVEL_DJANGO`` - Define the django log level.

``LOG_LEVEL_CHROMS`` - Define the chroms log level.

``LOG_LEVEL_FRAGMENTS`` - Define the fragments log level.

``LOG_LEVEL_TILESETS`` - Define the tilesets log level.

``UPLOAD_ENABLED`` - If ``true`` the HiGlass server accepts any kinds of uploads.

``PUBLIC_UPLOAD_ENABLED`` - If ``true`` the HiGlass server accepts public uploads.

``REDIS_HOST`` - IP address of your Redis server.

``REDIS_PORT`` - Port number of your Redis server.

``SNIPPET_HIC_MAX_OUT_DIM`` - If specified it limits the maximum size (in pixels) of the longer side of a Hi-C snippet.

``SNIPPET_HIC_MAX_DATA_DIM`` - If specified it limits the maximum size (in bins) of the longer side of the snippet that is pulled out of a cooler file.

``SNIPPET_IMG_MAX_OUT_DIM`` - If specified it limits the maximum size (in pixels) of the longer side of an image snippet.

``SNIPPET_OSM_MAX_DATA_DIM`` - If specified it limits the maximum size (in pixels) of the longer side of the OSM tiles that are pulled out for getting the image snippet.

``SNIPPET_IMT_MAX_DATA_DIM`` - If specified it limits the maximum size (in pixels) of the longer side of the image tiles that are pulled out for getting the image snippet.


API
---

Retrieving data (GET)
^^^^^^^^^^^^^^^^^^^^^

Retrieving a list of available tilesets:

.. code-block:: bash

  curl localhost:8000/api/v1/tilesets

To filter by a specific filetype, use the `t=filetype` parameter:

.. code-block:: bash

  curl localhost:8000/api/v1/tilesets?t=cooler

To filter by datatype, use the `dt=datatype` parameter:

.. code-block:: bash

  curl localhost:8000/api/v1/tilesets?dt=matrix
  curl localhost:8000/api/v1/tilesets?dt=gene-annotation
  curl localhost:8000/api/v1/tilesets?dt=chromsizes

Retrieving properties of a tileset, for a specific `uuid`:

.. code-block:: bash

  curl localhost:8000/api/v1/tilesets/${uuid}/

To delete a tileset, specify the tileset `uuid` in the URL, and use the `DELETE` method with authentication credentials:

.. code-block:: bash

  curl --user ${username}:${password} --request DELETE http://localhost:8000/api/v1/tilesets/${uuid}/

To modify a tileset name, specify the tileset `uuid` in the URL, use the `PATCH` method with authentication credentials, and specify the new name in the JSON object passed to the request:

.. code-block:: bash

  curl --user ${username}:${password} --request PATCH --header "Content-Type: application/json" --data '{"name":"new_name_of_tileset"}' http://localhost:8000/api/v1/tilesets/${uuid}/

To retrieve a particular tile, in this case tile `1` at zoom level `6` for the tileset named by the ``${uuid}`` variable:

.. code-block:: bash

  curl localhost:8000/api/v1/tiles?d=${uuid}.6.1

To retrieve many tiles at once, in this case tiles `0`, `1`, and `2` at zoom level `6` for the tileset ``${uuid}``:

.. code-block:: bash

  curl localhost:8000/api/v1/tiles?d=${uuid}.6.0&d=${uuid}.6.1&d=${uuid}.6.2

To retrieve multivec tiles with pre-aggregated rows, a `POST` request can be made to the ``/api/v1/tiles`` endpoint, with the following request body,
where ``my_uuid`` is the `tilesetUid` for a multivec tileset.
The request body will be validated against the JSON schema in the ``higlass-server`` repository `here <https://github.com/higlass/higlass-server/blob/develop/tilesets/json_schemas.py>`_.

.. code-block:: json

  [
    {
      "tilesetUid": "my_uuid",
      "tileIds": ["6.0", "6.1"],
      "options": {
        "aggFunc": "mean",
        "aggGroups": [
          [1, 2, 3],
          [0, 4, 9, 11]
        ]
      }
    }
  ]

The ``options.aggGroups`` option takes a 1- or 2- dimensional array of integers, where each integer represents an index of a row in the multivec file.
The ``options.aggFunc`` option takes one of the following string values: ``mean``, ``median``, ``std`` (standard deviation), ``var`` (variance), ``max``, ``min``.
The aggregation function is evaluated for each sub-array (group of rows) if ``options.aggGroups`` is a 2-dimensional array (along axis 0).

The response of the above `POST` request to ``/api/v1/tiles`` will have the following format.
The zeroth entry of the ``shape`` property is `2` for both of these aggregated tiles, since ``options.aggGroups`` contained two groups.

.. code-block:: json

  {
    "my_uuid.6.0": {
      "dense": "9GNDVOl...",
      "dtype": "float16",
      "shape": [
        2,
        256
      ]
    },
    "my_uuid.6.1": {
      "dense": "mnGScTN...",
      "dtype": "float16",
      "shape": [
        2,
        256
      ]
    }
  }


Uploading data (POST)
^^^^^^^^^^^^^^^^^^^^^

The server API can be used to upload entire tilesets. To use this
functionality, you need a username and password. These can be created using
``higlass-manage create superuser``. The should be entered into a file (e.g.
``~/.higlass-server-login)`` in the format ``username:password``.

The rest of the parameters should be specified according to the filetype,
datatype, coordSystem and name of the dataset.

.. code-block:: bash

  curl -u `cat ~/.higlass-server-login` \
      -F 'datafile=@/Users/peter/projects/negspy/negspy/data/mm10/chromInfo.txt' \
      -F 'filetype=chromsizes-tsv' \
      -F 'datatype=chromsizes' \
      -F 'coordSystem=mm10' \
      -F 'name=Chromosomes (mm10)' \
      http://higlass.io/api/v1/tilesets/

Tile JSON Response Format
^^^^^^^^^^^^^^^^^^^^^^^^^

Tiles returned by the server vary according to the data type but
all are indexed by their tile id. The example below is a tile response
from a bedlike track.

.. code-block:: bash

  {
    "OHJakQICQD6gTD7skx4EWA.3.2": [
      { "uid": "US2sjy_8SlGuy-0iSshcDQ", "importance": 457.0, "fields": [...] }
    ]
  }

The `uid` is used to unique identify annotations. This is necessary
because annotations that span multiple tiles are returned in every tile
they intersect. The `importance` determines the priority with which
annotations are hidden. Annotations with a lower `importance` are hidden
before annotations with a higher importance. The `fields` field
contains the actual columns from the bed file.

Management commands
^^^^^^^^^^^^^^^^^^^

The following commands may be run while logged into a non-Docker HiGlass
instance and offer functionality to list and manipulate tileset records.

Ingesting data:

.. code-block:: bash

  python manage.py ingest_tileset --filename my.cool --filetype cooler --datatype matrix \
    --project-name "Experiment 3" --coordSystem hg19

Use the filename parameter to indicate where the data file resides, the filetype to tell
the server how to read the data, the datatype to tell the client how it can be displayed,
the coordinate system to indicate which chromosome sizes to use, and the project name to
group it with other tilesets (available in v1.3.0 and above).

To retrieve a list of available tilesets:

.. code-block:: bash

  python manage.py list_tilesets

To modify the name of a tileset:

.. code-block:: bash

  python manage.py modify_tileset --uuid=${uuid} --name=${name}

.. note::  At this time, the `modify_tileset` command only provides the ability to modify the tileset name. Future revisions may provide logic to modify other tileset fields.

 To delete a tileset:

.. code-block:: bash

  python manage.py delete_tileset --uuid=${uuid}

.. note::  The `delete_tileset` command will delete the tileset record from the database backend. It will also delete the underlying file from the HiGlass server's `media/uploads` folder, and fail if this file cannot be removed.

Chromosome sizes
----------------

Chromosome sizes specify the lengths of the chromosomes that make up an
assembly. While they have no intrinsic biological order, HiGlass displays all
chromosomes together on a line so the order of the entries in the file does
have a meaning.

They must be imported with the `chromsizes-tsv` filetype and `chromsizes`
datatype to be properly recognized by the server and the API.

.. code-block:: bash

    docker exec higlass-container python \
            higlass-server/manage.py ingest_tileset \
            --filename /tmp/chromsizes_hg19.tsv \
            --filetype chromsizes-tsv \
            --datatype chromsizes

Or using curl:

.. code-block:: bash

    curl -u `cat ~/.higlass-server-login` \
        -F "datafile=@/Users/peter/projects/negspy/negspy/data/mm10/chromInfo.txt" \
        -F "filetype=chromsizes-tsv" \
        -F "datatype=chromsizes" \
        -F "coordSystem=mm10" \
        -F "name=Chromosomes (mm10)" \
        http://higlass.io/api/v1/tilesets/

This should return a JSON object containing a UUID to confirm that the data has been
added to the server:

.. code-block:: json

    {
       "uuid":"DRpJETNeTAShnhng6KhhXw",
       "datafile":"http://higlass.io/api/v1/tilesets/media/uploads/chromInfo_ui7zU3M.txt",
       "filetype":"chromsizes-tsv",
       "datatype":"chromsizes",
       "private":false,
       "name":"Chromosomes (mm10)",
       "coordSystem":"mm10",
       "coordSystem2":"",
       "created":"2017-08-10T18:44:40.369924Z"
    }

Development
-----------

Running the server locally:

.. code-block:: bash

    python manage.py runserver 8000

Testing
-------

.. code-block:: bash

  python manage.py test tilesets --failfast

Or to test a more specific code block:

.. code-block:: bash

  python manage.py test tilesets.tests.CoolerTest.test_transforms --failfast

Tests of deletion and modification routes:

.. code-block:: bash

  python manage.py test tilesets.tests.PermissionsTest
