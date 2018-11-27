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

``SNIPPET_HIC_MAX_DATA_DIM`` - If specified it limits the maximum size (in bins) of the longer side of the snippet the is pulled out of a cooler file.

``SNIPPET_IMG_MAX_OUT_DIM`` - If specified it limits the maximum size (in pixels) of the longer side of an image snippet.

``SNIPPET_OSM_MAX_DATA_DIM`` - If specified it limits the maximum size (in pixels) of the longer side of the OSM tiles that are pulled out for getting the image snippet.

``SNIPPET_IMT_MAX_DATA_DIM`` - If specified it limits the maximum size (in pixels) of the longer side of the image tiles that are pulled out for getting the image snippet.


Development
-----------

Running the server locally:

.. code-block:: bash
    
    python manage.py runserver 8000

Testing
-------

There are test in ``tilesets/views.py`` which can be run
from the command line:

.. code-block:: bash

    python manage.py test tilesets

More specific tests can be run by specifying the class and function
that contain the test:

.. code-block:: bash

    python manage.py test tilesets.tests.CoolerTest.test_get_multi_tiles

Chromosome sizes
^^^^^^^^^^^^^^^^ 
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

This should return a JSON object contain a UUID to confirm that the data has been 
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

API
---

Retrieving a list of available tilesets:

.. code-block:: bash
    
    curl localhost:8000/api/v1/tilesets

To filter by a specific filetype, use the `t=filetype` parameter:

.. code-block:: bash

    curl localhost:8000/api/v1/tilesets?t=cooler

To filter by datatype, use the `dt=datatype` parameter:

.. code-block:: bash

    curl localhost:8000/api/v1/tilesets?dt=matrix

Retrieving properties of a tileset, for a specific `uuid`:  

 .. code-block:: bash 

    curl localhost:8000/api/v1/tilesets/${uuid}/ 
      
To delete a tileset, specify the tileset `uuid` in the URL, and use the `DELETE` method with authentication credentials:  

 .. code-block:: bash 

    curl --user ${username}:${password} --request DELETE http://localhost:8000/api/v1/tilesets/${uuid}/  
      
To modify a tileset name, specify the tileset `uuid` in the URL, use the `PATCH` method with authentication credentials, and specify the new name in the JSON object passed to the request: 

 .. code-block:: bash 

    curl --user ${username}:${password} --request PATCH --header "Content-Type: application/json" --data '{"name":"new_name_of_tileset"}' http://localhost:8000/api/v1/tilesets/${uuid}/ 
      
Management commands 
^^^^^^^^^^^^^^^^^^^ 
 The following commands may be run while logged into a non-Docker HiGlass instance and offer functionality to list and manipulate tileset records.  
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

Testing
^^^^^^^

.. code-block:: bash

    python manage.py test tilesets --failfast

Or to test a more specific code block:

.. code-block:: bash

    python manage.py test tilesets.tests.CoolerTest.test_transforms --failfast

Tests of deletion and modification routes:  

 .. code-block:: bash 

    python manage.py test tilesets.tests.PermissionsTest
