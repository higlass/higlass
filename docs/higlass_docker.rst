Docker
######

Running locally
----------------

HiGlass can also be run locally as a docker container. The [higlass-docker](https://github.com/higlass/higlass-docker) repository contains detailed information about how to set it up and run it.

The simple example below stops any running higlass containers, removes them, pulls the latest version and runs it.

.. code-block:: bash

  docker stop higlass-container; 
  docker rm higlass-container;

  docker pull higlass/higlass-docker:v0.6.1 # higher versions are experimental and may or may not work


  docker run --detach \
             --publish 8989:80 \
             --volume ~/hg-data:/data \
             --volume ~/tmp:/tmp \
             --name higlass-container \
           higlass/higlass-docker:v0.6.1


The higlass website should now be visible at ``http://localhost:8989``. Take a look at the documentation for `adding a new track <https://github.com/higlass/higlass/wiki/Common-Tasks#adding-a-new-track>`_ to see how to display data.

Running remotely
----------------

For security reasons, an instance created this way will not be accessible from hosts other than "localhost". To make it accessible to other hosts, please specify a hostname using the ``SITE_URL`` environment variable:

.. code-block:: bash

  docker run --detach \
           --publish 8989:80 \
           --volume ~/hg-data:/data \
           --volume ~/tmp:/tmp \
           --name higlass-container \
           -e SITE_URL=my.higlass.org \
           higlass/higlass-docker:v0.6.1

To use the admin interface for managing the available datasets, a superuser needs to created:

.. code-block:: bash

  docker exec -it higlass-container higlass-server/manage.py createsuperuser

Once a username and password are created, the admin interface can be accessed at ``http://localhost:8989/admin``.
