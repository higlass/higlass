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
