HiGlass Client (Developer)
##########################

Adding new track types
**********************

To add a new track type, we first need a data source and a new
definition. To being, we can create a new test page to work 
with.

.. code-block:: bash

    cp app/test2.html app/testx.html

Within this page will be a sample viewconfig, that we need to add our new track
definition to. In this example, we'll be adding a 1D track. This just means
that it can only be zoomed into in one dimension. We'll add it to the list of
top tracks with the bare minimum of attributes. The tilesetUid was taken from
the `higlass server new filetypes section <higlass_server.html#new-filetypes>`_.

.. code-block:: json

        "top": [
                  {
            "server": "http://localhost:8000/api/v1",
            "tilesetUid": "RAh2nvU9THezcVuxBU3ioQ",
            "type": "horizontal-multivec",
            "height": 200,
            "position": "top"
          }
        ],

We can start higlass:

.. code-block:: bash

    npm install
    npm start

And then navigate to the test web page: http://localhost:8080/testx.html
Upon opening the developer console, we'll see an error message:

```
WARNING: unknown track type: horizontal-multivec
```

This is because HiGlass doesn't know how to handle this track type. In
this example, we'll give it a way of handling it.

First, we need to define this track type:

.. code-block:: javascript

  {
    type: 'horizontal-multivec',
    datatype: ['multivec'],
    local: false,
    orientation: '1d-horizontal',
    thumbnail: null,
    availableOptions: ['labelPosition', 'labelColor', 'valueScaling', 'labelTextOpacity', 'labelBackgroundOpacity', 'trackBorderWidth', 'trackBorderColor', 'trackType'],
    defaultOptions: {
      labelPosition: 'topLeft',
      labelColor: 'black',
      labelTextOpacity: 0.4,
      valueScaling: 'linear',
      trackBorderWidth: 0,
      trackBorderColor: 'black',
    },
  },

It has all of the standard track options, is horizontal, etc...

Now if we reload our test page, we still get the same warning. This is because
we don't actually know how to draw this track. We need to create a class which
knows how to draw this track type. We can do that by creating a new file in 
``app/scripts`` called ``HorizontalMultivecTrack.js``.

.. code-block:: bash

    cp app/scripts/HeatmapTiledPixiTrack.js app/scripts/HorizontalMultivecTrack.js

Here we need to change the name of the track and have it extend the HeatmapTrack:

.. code-block:: bash

    export class HorizontalMultivecTrack extends HeatmapTiledPixiTrack

Now we can register the new track type in `TrackRenderer.js:createTrackObject`:

.. code-block:: javascript

      case 'horizontal-multivec':
        return new HorizontalMultivecTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
          this.svgElement,
          () => this.currentProps.onValueScaleChanged(track.uid),
          newOptions =>
            this.currentProps.onTrackOptionsChanged(track.uid, newOptions),
        );

And add it to the imports at the top:

.. code-block:: javascript

    import HorizontalMultivecTrack from './HorizontalMultivecTrack';

Reloading our test page will now output a series of errors which we will fix
in `HorizontalMultivecTrack`. Here's the steps.

1. Replace ``tileToLocalId`` and ``tileToRemoteId`` with those from
   ``HorizontalLine1DPixiTrack``.  We do this because the ones we copied from
   the HeatmapTrack assume that there will be a data transform associated with
   the ID. This simple datatype has no associated transforms and thus only
   needs to encode the tile position in the ID.

2. Change ``calculateZoomLevel`` to only use the x domain in calculating the zoom
   level.

3. Change ``calculateVisibleTiles`` to only use the x domain in calculating the
   visible tiles.

4. Change ``tileDataToCanvas`` to change the width of the data to match that
   returned in the tileset info.

5. Change the ``zoomed`` function to maintain the the view at the origin.

6. Change ``setSpriteProperties`` to position the sprite on only the x axis.

1D Tracks
*********

Line Tracks
===========

Scaling
-------


1D tracks can either be linearly or log scaled. Linear scaling denotes a linear
mapping between the values and their position on the track. Log scaling means
that we take the log of the values before positioning them. 

Because the dataset may contain very small or even zero values, we add a
pseudocount equal to the median visible value to ensure that finer details in
the data are not drowned out by extreme small values.

The code for this can be found in ``HorizontalLine1DPixiTrack.drawTile``.


Interface
---------

visibleAndFetchedIds: Tile ids that correspond to tiles which are both visible
in the current viewport as well as fetched from the server.

visibleTileIds: Tiles which should be visible in the current viewport based on
the current viewport. Usually set by ``calculateVisibleTiles``.
