Tutorial
========

This tutorial describes how to set up a local instance of HiGlass and load some common data types.

Prerequisites
-------------

To follow the steps in this tutorial you will require the following software packages:

- Docker (https://www.docker.com/community-edition): Docker is program that
  lets you run "containers" hosting software and its dependencies
- Python
- ``higlass-manage``: This package is a wrapper for the Docker commands used to run a local instance. It can be installed using ``pip install higlass-manage``. Brief documentation can be found `at its GitHub project page <https://github.com/pkerpedjiev/higlass-manage>`_


Running HiGlass Locally
-----------------------

<<<<<<< HEAD
We can start a local HiGlass instance using ``higlass-manage``:

.. code-block:: bash

    higlass-manage start



This will create what is essentially a mini virtual machine running on your
computer. This command creates a data directory at ``~/hg-data``. All of the
ingested data data will be stored there. An alternative directory can be specified
using the ``--data-dir`` parameter.
=======
The first step to pull the latest HiGlass Docker image from our repository and run it.

.. code-block:: bash

    docker stop higlass-container;
    docker rm higlass-container;

    docker pull gehlenborglab/higlass:v0.2.60 # higher versions are experimental and may or may not work

    docker run --detach \
           --publish 8989:80 \
           --volume ~/hg-data:/data \
           --volume ~/tmp:/tmp \
           --name higlass-container \
           gehlenborglab/higlass:v0.2.60

This will create what is essentially a mini virtual machine running on your
computer. This virtual machine has its own filesystem and can only see files
within it. By using the ``--volume ~/hg-data:/data`` and ``-volume
~/hg-data/tmp`` parameters, we've exposed our local ``~/hg-data`` and
``-/hg-data`` directories to the virtual machine and can thus load files onto
it. 

The Docker container we started, ``higlass-container`` contains a web server 
running higlass. To access it, simply go to http://localhost:8989. You should
be greeted with an empty HiGlass view:


.. figure:: img/higlass-website-screenshot.png
    :align: center
    :figwidth: 500px
    
    A screenshot of an empty HiGlass web page

This indicates that the Docker container has succesfully started and you have
a HiGlass instance running on your computer.

Now to add some data...

Adding data
-----------

HiGlass supports a number of `different data types <data_preparation.html>`_. 

Use the ingest command to add new data. Generally data requires a filetype and a datatype. This can sometimes (i.e. in the case of cooler and bigwig files) be inferred from the file itself.

.. code-block:: bash

    higlass-manage ingest my_data.mcool

In other, more ambiguous cases, it needs to be explicitly specified:

.. code-block:: bash

    higlass-manage ingest my_file.bed --filetype bedfile \
        --datatype bedlike --assembly hg19

Note that bedfiles don't store chromosome sizes so they need to be passed in using either the ``--assembly`` or ``--chromsizes-filename`` parameters.

Viewing data
------------

To view the data we've added to our instance, we need to load the HiGlass
browser. This can be done by either opening a browser and navigating to
``http://localhost:8989/app`` (using the port specified), or using:

.. code-block:: bash

    higlass-manage browse

From there, we need to add the tracks:

.. figure:: img/add-tracks-diagram1.png
    :align: center
    :figwidth: 500px
    
    To add a track, click on the '+' and select a track position.

After selecting a position, we need to select a dataset to add. The dialog
shows both the local datasets as well as the public data available on
http://higlass.io.

.. figure:: img/add-tracks-diagram2.png
    :align: center
    :figwidth: 500px
    
    Select a dataset to add.

And we get our results

.. figure:: img/add-tracks-diagram3.png
    :align: center
    :figwidth: 500px
    
    Behold the added heatmap.

The same procedure can be used to add bigwig files on the top, left, right and bottom positions of the view.
