Tutorial
========

This tutorial describes how to set up a local instance of HiGlass and load some common data types.

Prerequisites
-------------

To follow the steps in this tutorial you will require the following software packages:

- Docker (https://www.docker.com/community-edition): Docker is program that
  lets you run "containers" hosting software and its dependencies


Running HiGlass Locally
-----------------------

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

