View Configs
##########################

Genome Position Search Box
**************************

The genome position search box section a view config is specific to each view.
It is used to search for locations in the view. The full configuration has a
pointer to a chromSizes file and an autocomplete source which will provide
suggestions for gene names. The automcomplete source should point to a
`gene-annotations` file.

.. code-block:: javascript

    {
        views: [
            {
                "genomePositionSearchBox": {
                    "autocompleteServer": "http://higlass.io/api/v1",
                    "autocompleteId": "OHJakQICQD6gTD7skx4EWA",
                    "chromInfoServer": "http://higlass.io/api/v1",
                    "chromInfoId": "hg19",
                    "visible": true
                }
        ]
    }


