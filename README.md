# 4DN Matrix Viewer
Fast contact matrix visualization for the web.

## Tiling

This section will enumerate the different strategies for tiling the matrix data and serving it
in hierarchical layers.

### Bounds

Each matrix describes data with an x-range of [min_x, max_x] and a y-range of
[min_y, max_y]. To generalize, the format for describing the tileset will group
the minimum bounds in the `min_pos` entry and the maximum bounds in the
`max_pos` section. This means that the topmost tile (`zoom_level = 0`) has a
width of `top_level_width = max_pos[i] - min_pos[i]` for each dimension `i`.
Each subsequent zoom level divides the width of the top level tile by 2.  The
width of a tile at zoom_level `z` is then `top_level_width / (2 ** z)`.

    {
      "min_importance": 1.0,
      "min_pos": [
        16000000.0,
        16200000.0
      ],
      "max_value": 48198.0,
      "min_value": 1.0,
      "max_zoom": 5,
      "max_importance": 48198.0,
      "max_pos": [
        30800000.0,
        30900000.0
      ]
    }

The tile at zoom level `z` and position `p` should contain a representation of
the data located in the range `[min_pos[i] + p * tile_width, min_pos[i] + (p+1)
* tile_width)`. Individidual tiles contain a `tile_start_pos` and a
  `tile_end_pos` which denote the boundaries of the data that this tile
  contains.  This information can be calculated if the bounds of the top level
  tile and the zoom level are known, but are included in each individual tile
  for the sake of convenience.

    {
      "tile_start_pos": [
        16000000.0,
        16200000.0
      ],
      "tile_end_pos": [
        16925000.0,
        17125000.0
      ],
        "shown": [
        {
          "count": 4.0,
          "pos2": 16200000.0,
          "uid": "gdRgrWzcwGpWX8uFi8fgFU",
          "pos1": 16200000.0
        },
        ...
        ...
        ]
      "zoom": 4,
      "tile_num": [
        0,
        0
      ]
    }


### Aggregation

By default, the data is not aggregated and the larger tiles may have an
overwhelmingly large amount of data to display. For this purpose, we need to
aggregate or abstract the data from the more detailed tiles to decide what to
display at lower resolution.

There are a number of ways in which we can do this. 

### Sampling

The easiest approach is to simply take every n'th entry and display that.

### Summing

A [slightly] more sophisticated approach is to aggregate data points by summing
nearby values and presenting them as a single point. Care needs to be taken in 
edge cases and between tiles.


    160        160        12.0
    162        162        4.0
    161        163        1.0
    162        163        4.0
    163        163        15.0
    162        164        1.0

In this matrix, we can see that the minimum distance between data points is 1.
To go up one level of resolution, we may want to aggregate data so that the
minimum distance between points along either dimension is 2. This would mean
that we bin the points into the following set:

    160     160 12.0     # ([160, 161], [160, 161])
    160     162 1.0      # ([160, 161], [162, 163])
    160     164 0.0      # ([160, 161], [164, 165])
    162     160 0.0      # ([162, 163], [160, 161])
    162     162 23.0     # (4.0 + 4.0 + 15.0) ([162, 163], [162, 163])
    162     164 1.0      # ([162, 163], [164, 165])

And one level above that:

    160     160 36.0    #([160, 163], [160, 163]) (12.0 + 1.0 + 23.0)
    160     164 1.0 #([160, 164], [160, 164]) (1.0)
    164     160 0.0 #([164, 168], [160, 164])
    164     164 0.0 #([164, 168], [164, 168])

Etc...


