================
Data Preparation
================

Displaying large amounts of data often requires first turning it into
not-so-large amounts of data. Clodius is a program and library designed
to aggregate large datasets to make them easy to display at different
resolutions.

Bed Files
---------

BED files specify genomic intervals. They are aggregated according to an
importance function that determines which values should be visible at lower
zoom levels. This importance function is user specified. In the absence of
any clear ranking of the different lines in the BED file, a random value
can be used in lieu of the importance function.

Example BED file:

.. code-block:: bash

    chr9    135766734       135820020       TSC1    Biallelic inactivation may predict sensitivity to MTOR inhibitors
    chr16   2097895 2138721 TSC2    Biallelic inactivation may predict sensitivity to MTOR inhibitors
    chr3    10183318        10195354        VHL     May signal the presence of a germline mutation.
    chr11   32409321        32457081        WT1     May signal the presence of a germline mutation.

This file can be aggregated like so:

.. code-block:: bash

    clodius aggregate bedfile \
        --assembly hg19 \
        --importance-column 5 \
        sorted_genes_target_db.tsv


BedGraph files
--------------

.. warning:: The order of the chromosomes in the bedgraph file have to
    be consistent with the order specified for the assembly in 
    `the negspy repository <https://github.com/pkerpedjiev/negspy/tree/master/negspy/data>`_.

Ordering the chromosomes in the input file
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: bash

    input_file=~/Downloads/phastCons100way.txt.gz;
    output_file=~/Downloads/phastConst100way_ordered.txt;
    chromnames=$(awk '{print $1}' ~/projects/negspy/negspy/data/hg19/chromInfo.txt);
    for chr in $chromnames; 
        do echo ${chr}; 
        zcat $input_file | grep "\t${chr}\t" >> $output_file;
    done;


Aggregation by addition
^^^^^^^^^^^^^^^^^^^^^^^

Assume we have an input file that has ``id chr start end value1 value2`` pairs::

    location        chrom   start   end     copynumber      segmented
    1:2900001-3000000       1       2900001 3000000 -0.614  -0.495
    1:3000001-3100000       1       3000001 3100000 -0.407  -0.495
    1:3100001-3200000       1       3100001 3200000 -0.428  -0.495
    1:3200001-3300000       1       3200001 3300000 -0.437  -0.495


We can aggregate this file by recursively summing adjacent values. We have to
indicate which column corresponds to the chromosome (``--chromosome-col 2``),
the start position (``--from-pos-col 3``), the end position (``--to-pos-col 4``) 
and the value column (``--value-col 5``). We specify that the first line
of the data file contains a header using the (``--has-header``) option.

.. code-block:: bash

    clodius aggregate bedgraph          \
        test/sample_data/cnvs_hw.tsv    \
        --output-file ~/tmp/cnvs_hw.hitile \
        --chromosome-col 2              \
        --from-pos-col 3                \
        --to-pos-col 4                  \
        --value-col 5                   \
        --assembly grch37               \
        --nan-value NA                  \
        --transform exp2                \
        --has-header                    

Data Transform
""""""""""""""

The dataset used in this example contains copy number data that has been log2
transformed. That is, the copy number given for each bin is the log2 of the
computed value. This is a problem for HiGlass's default aggregation method of
summing adjacent values since :math:`\log_2 a + \log_2 b \neq \log_2 ab`.

Using the ``--transform exp2`` option tells clodius to raise two to the
power of the provided value before doing the transformation and storing. As
an added benefit, NaN values become apparent in the resulting because they
have values of 0.

NaN Value Identification
""""""""""""""""""""""""

NaN (not a number) values in the input file can be specified using the
``--nan-value`` option.  For example, ``--nan-value NA`` indicates that
whenever *NA* is encountered as a value it should be treated as NaN. In the
current implementation, NaN values are simply treated as 0. In the future, they
should be assigned a special value so that they are ignored by `HiGlass`_.

.. _higlass: http://higlass.io

When NaN values are aggregated by summing, they are treated as 0 when added to
another number. When two NaN values are added to each other, however, the
result is Nan.

NaN Value Counting
""""""""""""""""""

Sometimes, we just want to count the number of NaN values in the file. The
``--count-nan`` option effectively treats NaN values as 1 and all other values
as 0. This makes it possible to display a track showing how many NaN values are
present in each interval. It also makes it possible to create compound tracks
which use that information to normalize track values.

bigWig files
------------

`bigWig files <https://genome.ucsc.edu/goldenpath/help/bigWig.html>`_ store
genomic data in a compressed, indexed form that allows rapid retrieval and
visualization. Unfortunately, for the time being, HiGlass does not support
displaying bigWig files and they must first be converted to hitile files.
This can be done using clodius's aggregate bigwig function:

.. code-block:: bash

    clodius aggregate bigwig input.bigWig \
        --output-file output.hitile \
        --assembly hg19

The resulting file can be loaded into HiGlass as described in the
:ref:`loading-into-higlass` section below.

.. _loading-into-higlass:

Loading into HiGlass
--------------------

Too see .hitile-typed datasets in higlass, use the docker container to load them:

.. code-block:: bash

    docker exec higlass-container python \
            higlass-server/manage.py ingest_tileset \
            --filename /tmp/cnvs_hw.hitile \
            --filetype hitile \
            --datatype vector

It can also be loaded using a curl commands:

.. code-block:: bash
    
    curl -u `cat ~/.higlass-server-login`  \
        -F "datafile=@cnvs_hw.hitile" \
        -F "filetype=hitile" \
        -F "datatype=vector" \
        -F "coordSystem=hg19" \
        http://higlass.io:80/api/v1/tilesets/

.. todo:: And navigate to 127.0.0.1:8989, click on the '+' symbol, select a track
          position, find the dataset in the list of the datasets and click OK to
          view it. And stuff.

Development
-----------

Building for development
^^^^^^^^^^^^^^^^^^^^^^^^

The recommended way to develop ``clodius`` is to use a `conda`_ environment and 
install ``clodius`` with develop mode:

.. _conda: https://conda.io/docs/intro.html

.. code-block:: bash

    python setup.py develop

Note that making changes to the ``clodius/fast.pyx`` `cython`_ module requires an
explicit recompile step:

.. _cython: http://docs.cython.org/en/latest/src/quickstart/cythonize.html

.. code-block:: bash
   
    python setup.py build_ext --inplace

Testing
^^^^^^^

The unit tests for clodius can be run using `nosetests`_::

    nosetests tests

Individual unit tests can be specified by indicating the file and function
they are defined in::

    nosetests test/cli_test.py:test_clodius_aggregate_bedgraph


.. _nosetests: http://nose.readthedocs.io/en/latest/



Building the documentation
^^^^^^^^^^^^^^^^^^^^^^^^^^

Building the documentation from the root directory is a matter of running
``sphinx-build``::

    sphinx-build docs -b html docs/_build/html

To view the documentation, go to the build directory and start an http server::

    cd docs/_build/html
    python -m http 8081
