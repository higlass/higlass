import json
import pandas as pd
import make_tiles as mt
import sys

class Options:
    def __init__(self, importance, position):
        self.importance = importance
        self.position = position
        self.max_entries_per_tile = 1
        self.max_zoom = 3


def test_tsv_tiles():
    '''
    Test the make_tiles function using a TSV file as input

    '''
    options = Options('count', ['pos1', 'pos2'])
    tiles = mt.make_tiles_from_file('test/data/hic_small.tsv', options)

    print >>sys.stderr, "tiles:", tiles
        
def xest_tiles():
    """Test the make_tiles function and create an array of one dimensional
    vector tiles for this data.

    :returns: None

    """
    entries = [{'pos': 3, 'val': 15.99},
               {'pos': 0, 'val': 7.27},
               {'pos': 5, 'val': 3.88},
               {'pos': 6, 'val': 3.05},
               {'pos': 4, 'val': 3.02},
               {'pos': 1, 'val': 2.99},
               {'pos': 2, 'val': 2.48}]

    '''
    print >>sys.stderr, "testing"
    print >>sys.stderr, "mt:", mt
    '''

    options = Options('val', 'pos')

    options.max_pos = max(map(lambda x: x[options.position], entries))
    options.min_pos = min(map(lambda x: x[options.position], entries))

    '''
    print >>sys.stderr, "min_pox:", options.min_pos
    print >>sys.stderr, "max_pos:", options.max_pos
    '''

    tiles = mt.make_tiles(entries, options, zoom_level = 0, 
                  start_x = options.min_pos,
                  end_x = options.max_pos)

    '''
    for tile in sorted(filter(lambda x: x['zoom'] == 3, tiles), key=lambda x: x['start_x']):
        print >>sys.stderr, "tile:", tile['start_x'], tile['end_x'], tile['shown']
        #print >>sys.stderr, tile

    print >>sys.stderr, "------------------------------------"
    print >>sys.stderr, "Tiles:"
    print >>sys.stderr, json.dumps(tiles)
    '''

    # check that the number of tiles with non-empty shown arrays is equal
    # to the length of entries
    non_empty_tiles = filter(lambda x: len(x['shown']) > 0, tiles)
    all_poss = set(map(lambda x: x['shown'][0]['val'], non_empty_tiles))

    '''
    print >>sys.stderr, "non_empty_tiles", non_empty_tiles
    print >>sys.stderr, "------------------------------------"
    print >>sys.stderr, "all_poss:", all_poss
    '''

    assert(len(all_poss) == len(entries))

    pass
