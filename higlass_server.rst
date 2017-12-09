HiGlass Server
==============

.. toctree::
    :maxdepth: 2
    :caption: Contents:

Configuration
-------------

The HiGlass server accepts a number of options to customize its use.
Most of these options are set using environment variables before the
server is started:

.. code-block:: bash

    export OPTION=value; python manage.py runserver

``BASE_DIR`` - Set the Django base directory. This is where Django will 
look for the database and the media directories.

``REDIS_HOST`` - The host name for the redis server to use for tile caching.  If
it's not specified, then no in-memory tile caching will be performed.

``REDIS_PORT`` - The port for redis server to use for tile caching. If it's not
set and a host is provided, the default port will be used.



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

Importing data
--------------

Different types of data can be imported into the higlass server.

New filetypes
-------------

For this example, we'll start in the ``higlass-server`` directory. The server
needs to be running using this command:

.. code-block:: bash

    python manage.py runserver

The first step in creating a new filetype is to name it. The name shouldn't
overlap with an existing filetype. In this example we'll call our file type
``multivec``. This is technically a matrix, but it's only zoomable across
one dimension.

Next we need to ingest the file into the server:

.. code-block:: bash
    
    python manage.py   ingest_tileset   --filename tmp/my_file.multires   --datatype multi-vector   --filetype multivec   --coordSystem hg19

Now, we can query the server to get the uuid of the dataset:

.. code-block:: bash

    pete@twok:~/projects/higlass-server [master|!SP]$ curl 127.0.0.1:8000/api/v1/tilesets/?t=multivec

    {"count":1,"next":null,"previous":null,"results":[{"uuid":"RAh2nvU9THezcVuxBU3ioQ","datafile":"http://127.0.0.1:8000/api/v1/tilesets/media/uploads/my_file.multires","filetype":"multivec","datatype":"multi-vector","private":false,"name":"my_file.multires","coordSystem":"hg19","coordSystem2":"","created":"2017-12-09T15:07:04.890027Z"}]}

So now we know that our file as a uuid of ``RAh2nvU9THezcVuxBU3ioQ``. We can use that to try to retrieve the tileset info.

.. code-block:: bash

    pete@twok:~/projects/higlass-server [master|!SP]$ curl 127.0.0.1:8000/api/v1/tileset_info/?d=RAh2nvU9THezcVuxBU3ioQ&

    {"RAh2nvU9THezcVuxBU3ioQ": {"message": "Unknown filetype multivec", "name": "my_file.multires", "coordSystem": "hg19", "coordSystem2": ""}}

Since we haven't implemented this filetype, the server doesn't know how to
handle it.  To let it know, we need to add a hook in the ``tileset_info``
function in ``tilesets/views.py``. Simply add an extra if clause:

.. code-block:: bash

      elif tileset_object.filetype == 'multivec':
          tileset_infos[tileset_uuid] = tgt.generate_multivec_tileset_info(
                  tut.get_datapath(tileset_object.datafile.url))

In the above snipped ``tileset_object`` is the database object which describes
the file. If it is of type ``multived`` we need to return a special type of
``tileset_info``. This should be placed in ``tilesets/generate_tiles.py``:

.. code-block:: python

    def generate_multivec_tileset_info(ffilename):
        '''
        Return some information about this tileset that will
        help render it in on the client.
        
        Parameters
        ----------
        filename: str
            The filename of the h5py file containing the tileset info
        
        Returns
        -------
        tileset_info: {}
            A dictionary containing the information describing
            this dataset
        '''
        f = h5py.File(filename, 'r')
        # a sorted list of resolutions, lowest to highest
        # awkward to write because a the numbers representing resolution
        # are datapoints / pixel so lower resolution is actually a higher
        # number
        resolutions = sorted([int(r) for r in f['resolutions'].keys()])[::-1]
        
        # the "leftmost" datapoint position
        # an array because higlass can display multi-dimensional
        # data
        min_pos = [0]
        
        # the "rightmost" datapoint position
        max_pos = [len(f['resolutions'][str(resolutions[-1])])]
        tile_size = 1024

        f.close()
        
        return {
            'resolutions': resolutions,
            'min_pos': min_pos, 
            'tile_size': tile_size
        }

Now when we hit the `/api/v1/tileset_info/?d=`` endpoint, we should get a valid
response:

.. code-block:: bash

    pete@twok:~/projects/higlass-server [master|!SP]$ curl localhost:8000/api/v1/tileset_info/?d=RAh2nvU9THezcVuxBU3ioQ
    {"RAh2nvU9THezcVuxBU3ioQ": {"resolutions": [128, 64, 32, 16, 8, 4, 2, 1], "min_pos": [0], "tile_size": 1024, "name": "my_file.multires", "coordSystem": "hg19", "coordSystem2": ""}}

Now that we have the tileset info, we just need the tiles. We can verify that
we have no way of accessing tiles right now:

.. code-block:: bash
    
    pete@twok:~/projects/higlass-server [master|!SP]$ curl localhost:8000/api/v1/tiles/?d=RAh2nvU9THezcVuxBU3ioQ.0.0
    {"RAh2nvU9THezcVuxBU3ioQ.0.0": {"error": "Unknown tileset filetype: multivec"}}


Chromosome sizes
~~~~~~~~~~~~~~~~

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

Testing
^^^^^^^

.. code-block:: bash

    python manage.py test tilesets --failfast

Or to test a more specific code block:

.. code-block:: bash

    python manage.py test tilesets.tests.CoolerTest.test_transforms --failfast
