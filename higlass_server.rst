HiGlass Server
==============

.. toctree::
    :maxdepth: 2
    :caption: Contents:

Development
-----------

Running the server locally:

.. code-block:: bash
    
    python manage.py runserver 8000

Testing
^^^^^^^

.. code-block:: bash

    python manage.py test tilesets --failfast

Or to test a more specific code block:

.. code-block:: bash

    python manage.py test tilesets.tests.CoolerTest.test_transforms --failfast
