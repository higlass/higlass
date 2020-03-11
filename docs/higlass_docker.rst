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

Networking configuration
************************

When setting up higlass-docker locally or remotely, docker creates virtual netowrking interafces that utilize real IP-addresses and modify host's routing table. Default pools of IP-addresses used by docker may create local networking interferences (e.g. with Wi-Fi routers, VPN-servers, etc).
One could avoid such interferences by configuring pool of IP-addresses that are utilized by docker ``/etc/docker/daemon.json``, e.g.:

.. code-block:: json

   {
       "default-address-pools":
        [
          {"base":"172.40.0.1/16","size":24}
        ]
   }
   
See relevant `discussion <https://forums.docker.com/t/custom-ip-range-for-new-networks/60839>`_ on docker-forums for further details.
