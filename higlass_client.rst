HiGlass Client
##############

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
