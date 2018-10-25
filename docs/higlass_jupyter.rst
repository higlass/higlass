Jupyter Notebooks
#################

Python `Jupyter notebooks <http://jupyter.org/>`_ are an excellent way to
experiment with data science and visualization. Using the higlass-jupyter
extension, you can use HiGlass directly from within a Jupyter notebook.

Installation
-------------

To use higlass within a Jupyter notebook you need to install a few packages
and enable the jupyter extension:


.. code-block:: bash

    pip install jupyter hgflask higlass-jupyter 

    jupyter nbextension install --py --sys-prefix --symlink prefix higlass_jupyter
    jupyter nbextension enable --py --sys-prefix prefix higlass_jupyter


Uninstalling
^^^^^^^^^^^^

.. code-block:: bash

    jupyter nbextension uninstall --py --sys-prefix higlass_jupyter

Usage
^^^^^

To instantiate a HiGlass component within a Jupyter notebook, we first need
to specify which data should be loaded. This can be accomplished with the 
help of the ``hgflask.client`` module:

.. code-block:: python

    import hgflask.client as hgc
    conf = hgc.HiGlassConfig()
    view = conf.add_view()
    track = view.add_track('CQMd6V_cRw6iCI_-Unl3PQ', 
        track_type='heatmap', position='center',
        server='http://higlass.io/api/v1/')

This config can then be passed to the `HiGlassDisplay` object to render the
selected dataset:

.. code-block:: python

    import higlass_jupyter as hgj
    hgj.HiGlassDisplay(viewconf=conf.to_json_string())

Serving local data
^^^^^^^^^^^^^^^^^^

To view local data, we need to set up a temporary server:

.. code-block:: python

    import hgflask as hgf

    tilesets = [{
        'filepath': filename,
        'uuid': 'a'
    }]

    server = hgf.start(tilesets)

We can then test if the server is running:

.. code-block:: python

    server.tileset_info('a')

And display the data:

.. code-block:: python

    track = (hgc.HiGlassConfig()
        .add_view() 
        .add_track('a', 'heatmap', 'center', server=server.api_address))
    hgj.HiGlassDisplay(viewconf=conf.to_json_string())



