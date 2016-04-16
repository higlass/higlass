#!/usr/bin/python

import argparse
import collections as col
import itertools as it
import json
import os
import os.path as op
import pandas as pd
import random
import shortuuid
import sys

def summarize_data(max_entries):
    '''
    Summarize the data into a maximum of max_entries.

    :return: A function that can be called on a dataset to 
    condense it into a maximum of max_entries entries.
    '''
    def condense(data):
        random.shuffle(data)
        return data[:max_entries]

    return condense

def halve_resolution(entries):
    '''
    Halve the resolution of a data matrix.

    :param entries: The data in the matrix
    '''
    pos1_diffs = []
    pos2_diffs = []

    # iterate over consecutive entries in the sparse matrix format
    # 16000000        16000000        12.0
    # 16200000        16200000        4.0
    # 16100000        16300000        1.0
    # with the purpose of determining the minimum distance between 
    # two entries on each axis (100000, 100000)
    # (trying to determine the resolution of the grid)
    for first, second in it.izip(entries, entries[1:]):
        if second['pos1'] - first['pos1'] > 0:
            pos1_diffs += [second['pos1'] - first['pos1']]

        if second['pos2'] - first['pos2'] > 0:
            pos2_diffs += [second['pos2'] - first['pos2']]

    new_pos1_diff = min(pos1_diffs) * 2
    new_pos2_diff = min(pos2_diffs) * 2

    min_pos1 = min(map(lambda x: x['pos1'], entries))
    min_pos2 = min(map(lambda x: x['pos2'], entries))

    new_entries = col.defaultdict(float)

    for entry in entries:  
        x1 = (entry['pos1'] - min_pos1) / new_pos1_diff 
        x2 = (entry['pos2'] - min_pos2) / new_pos1_diff 

        pos1_bin = min_pos1 + int(x1) * new_pos1_diff
        pos2_bin = min_pos2 + int(x2) * new_pos2_diff

        new_entries[(pos1_bin, pos2_bin)] += entry['count']

    new_entries_list = map(lambda x: {
        'pos1': x[0][0], 
        'pos2': x[0][1],
        'count': x[1] }, new_entries.items())

    return new_entries_list

def split_data(data, dim_names, mins, maxs, zoom_level, max_tile_dim, 
        summarize_data = None):
    '''
    Split the data into an n-dimensional array (where
    n = len(mins) = len(maxs)). Each dimension will have
    2 ** zoom_level entries.

    :param data: The data set
    :param dim_names: The names of the dimensions
    :param mins: The minimum values along each dimension
    :param maxs: The maximum values along each dimension
    :return: A dictionary indexed by zoom and position (i.e. (4, 15, 19))
    '''
    print >>sys.stderr, "splitting data at zoom_level: {}...".format(zoom_level)
    tile_width = (max_tile_dim) / 2 ** zoom_level

    positions = range(int((maxs[0] - mins[0]) / tile_width) + 1) # +1 to avoid empty positions
    tile_positions = it.product(positions, repeat= len(dim_names))

    split_data = {}

    for position in tile_positions:
        filtered_data = data

        data_mins = []
        data_maxs = []
        
        for dim_num,pos in enumerate(position):
            dim_name = dim_names[dim_num]

            data_mins.append(mins[dim_num] + pos * tile_width)
            data_maxs.append(mins[dim_num] + (pos+1) * tile_width)

            filtered_data = filter(lambda x: x[dim_name] >= data_mins[-1], filtered_data)
            filtered_data = filter(lambda x: x[dim_name] < data_maxs[-1], filtered_data)

            if summarize_data is not None:
                filtered_data = summarize_data(filtered_data)

            for entry in filtered_data:
                entry['uid'] = shortuuid.uuid()

        split_data[tuple([zoom_level] + list(position))] = {
            "zoom": zoom_level,
            "tile_num": position,
            "tile_start_pos": data_mins,
            "tile_end_pos": data_maxs,
            "shown": filtered_data }

    return split_data

def make_all_tiles(entries, dim_names, max_zoom, min_value_field, 
        max_value_field, importance_field):
    '''
    Make all the tiles for a set of data

    :param data: The entire data set
    :param dim_names: The column names which contain the different 
                      position values of the data points
    :param max_zoom: The maximum zoom level allowed
    :param importance_field: The field indicating how important an entry is
    :param value_field: The field containing the value for each data point
        (can be the same as the importance field)
    :return: A set of tiles, each one containing a position which
             is an array of length n, where n is equal to len(dim_names) 
    '''

    # record the minimum and maximum values in each dimension
    mins = [min(map(lambda x: x[pos], entries)) for pos in dim_names]
    maxs = [max(map(lambda x: x[pos], entries)) for pos in dim_names]

    if len(entries) > 0:
        min_value = entries[0][min_value_field]
        max_value = entries[0][max_value_field]
    else:
        min_value = 0
        max_value = 0

    print >>sys.stderr, "max_value:", max_value

    tileset_info = {}


    # the largest width along one axis
    # we need this so we can create square tiles
    max_tile_dim = max(map(lambda x: x[1] - x[0], zip(mins, maxs)))

    # calculate the subsets of data corresponding to each zoom level
    # the result of each split_data should be an n-dimensional array
    # containing the data in each tile
    data_subsets = []
    max_entries_per_tile = 300

    for zl in range(max_zoom)[::-1]:
        data_subset = split_data(entries, dim_names, mins, maxs, zl, max_tile_dim)
        max_data_length = max(map(lambda x: len(x['shown']), data_subset.values()))

        min_value = min([min_value] + map(lambda x: float(x[min_value_field]), entries))
        max_value = max([max_value] + map(lambda x: float(x[max_value_field]), entries))

        print >>sys.stderr, "max_value:", max_value

        entries = halve_resolution(entries)

        '''
        fraction_to_keep = max_entries_per_tile / float(max_data_length)
        if fraction_to_keep < 1:
            for tile in data_subset.values():
                tile['shown'] = random.sample(tile['shown'], int(len(tile['shown']) * fraction_to_keep))
                print map(lambda x: x['count'], tile['shown'])
        '''

        data_subsets.append(data_subset)

    #data_subsets = [split_data(entries, dim_names, mins, maxs, zl, max_tile_dim) for zl in range(max_zoom)]
    tileset_info['min_importance'] = (min(map(lambda x: float(x[importance_field]), entries)))
    tileset_info['max_importance'] = (max(map(lambda x: float(x[importance_field]), entries)))
    tileset_info['min_pos'] = mins
    tileset_info['max_pos'] = maxs
    tileset_info['max_value'] = max_value
    tileset_info['min_value'] = min_value
    tileset_info['max_zoom'] = max_zoom
    

    return {"tileset_info": tileset_info, "tiles": data_subsets}

def make_tiles_from_file(filename, options):
    '''
    Create tiles for a dataset stored in a file.

    The data set can be either in JSON or tsv format. We will first try loading
    it as JSON and if that fails, we will default to tsv.

    :param filename: The name of the file containing the data for which to
                     make tiles.

    :return: An array of tiles, each in json format.
    '''
    dim_names = options.position.split(',')

    with open(filename, 'r') as f:
        try:
            json.load(f)
        except ValueError:
            # not a JSON file
            if options.column_names is None:
                df = pd.read_csv(filename, delimiter='\t')
            else:
                df = pd.read_csv(filename, delimiter='\t', header=None)
                df.columns = options.column_names.split(',')

            entries = map(lambda x: dict(zip(df.columns, x)), df.values)
            print >>sys.stderr, "Making tiles..."
            #print >>sys.stderr, "df.columns:", df.columns
            #print >>sys.stderr, "entries:", entries

            tileset = make_all_tiles(entries, options.position.split(','), 
                    options.max_zoom, 
                    options.min_value, options.max_value, options.importance )

            with open(op.join(options.output_dir, 'tile_info.json'), 'w') as f:
                json.dump(tileset['tileset_info'], f, indent=2)

            for zoom_tileset in tileset['tiles']:
                for key in zoom_tileset:
                    outpath = op.join(options.output_dir, '/'.join(map(str, key)) + '.json')
                    outdir = op.dirname(outpath)

                    if not op.exists(outdir):
                        os.makedirs(outdir)

                    with open(outpath, 'w') as f:
                        json.dump(zoom_tileset[key], f, indent=2)
            '''
            options.min_pos = min(map(lambda x: x[options.position], entries))
            options.max_pos = max(map(lambda x: x[options.position], entries))

            return make_tiles(entries, options, zoom_level = 0,
                    start_x = options.min_pos, end_x = options.max_pos)
            '''

def make_tiles(entries, options, zoom_level, start_x, end_x):
    """
    Create tiles for all of the passed in entries.

    If the passed in entries have the following positions and areas:

    3 15.99
    0 7.27
    5 3.88
    6 3.05
    4 3.02
    1 2.99
    2 2.48

    0 1 2 3 4 5 6

    And we only allow one area per tile, then the returned
    tiles will be:

    Left: always from start(parent) to start(parent) + (end(parent) - start(parent) / 2)
    right: always from (end(parent) - start(parent) / 2) + 1 to end(parent)
    shown: the ones with the maximum values within that tile


    {shown: [3], from: 0, to: 6, zoom: 0,
        left: { shown: [3], from: 0, to: 3, zoom: 1
           left: { from: 0, to: 1, shown: [0], zoom: 1
              left: {from: 0, to: 0, shown: [0] }
              right: {from: 1, to 1, shown: [1] }
           }
           right: { from: 2, to: 3, shown: [2] 
              left { from: 2, to: 2, shown: [2] },
              right { from 3, to: 3, shown: [3] }
           }
        }
        right:  { shown: [4], from: 4, to: 7,

        }
    }

    :entries: The list of objects to make tiles for
    :options: Options passed in to the program
    :options.position: The name of the column containing the position
    :options.importance: The name of the column indicating how important each data
                 point is
    :options.max_entries: The maximum number of entries per tile
    :options.zoom_level: The current zoom level
    :options.start_x: The initial x position
    :options.end_x: The final x position
    :returns:
    """

    # show only a subset of the entries that fall within this tile
    tile = {}
    for entry in entries:
        entry['uid'] = shortuuid.uuid()
    tile['shown'] = sorted(entries, key=lambda x: -float(x[options.importance]))[:options.max_entries_per_tile]
        
    tile['start_x'] = start_x
    tile['end_x'] = end_x
    tile['zoom'] = zoom_level

    midpoint = (end_x + start_x) / 2.

    tile['num'] = int(((midpoint - options.min_pos) /
                   ((options.max_pos - options.min_pos) / float(2 ** zoom_level))))

    left_entries = filter(lambda x: x[options.position] <= midpoint, entries)
    right_entries = filter(lambda x: x[options.position] > midpoint, entries)
    tiles = [tile]

    if zoom_level < options.max_zoom:
        tiles += make_tiles(left_entries, options, zoom_level+1, start_x = start_x,
                end_x = midpoint)
        tiles += make_tiles(right_entries, options, zoom_level+1, start_x = midpoint,
                end_x = end_x)

    return tiles

def main():
    usage = """
    python make_tiles.py input_file

    Create tiles for all of the entries in the JSON file.
    """
    num_args= 1
    parser = argparse.ArgumentParser()

    #parser.add_argument('-o', '--options', dest='some_option', default='yo', help="Place holder for a real option", type='str')
    #parser.add_argument('-u', '--useless', dest='uselesss', default=False, action='store_true', help='Another useless option')
    parser.add_argument('input_file')
    parser.add_argument('-i', '--importance', dest='importance', default='importance',
            help='The field in each JSON entry that indicates how important that entry is',
            type=str)

    group = parser.add_mutually_exclusive_group()
    group.add_argument('-p', '--position', dest='position', default='position',
            help='Where this entry would be placed on the x axis',
            type=str)
    group.add_argument('-s', '--sort-by', 
            default=None,
            help='Sort by a field and use as the position') 

    parser.add_argument('-e', '--max-entries-per-tile', dest='max_entries_per_tile', default=100,
        help='The maximum number of entries that can be displayed on a single tile',
        type=int)
    parser.add_argument('-c', '--column-names', dest='column_names', default=None)
    parser.add_argument('-m', '--max-zoom', dest='max_zoom', default=5,
            help='The maximum zoom level', type=int)
    parser.add_argument('--min-pos', dest='min_pos', default=None,
            help='The minimum x position', type=float)
    parser.add_argument('--max-pos', dest='max_pos', default=None,
            help='The maximum x position', type=float)
    parser.add_argument('-o', '--output-dir', help='The directory to place the tiles',
                        required=True)
    parser.add_argument('--min-value', help='The field which will be used to determinethe minimum value for any data point', default='min_y')
    parser.add_argument('--max-value', help='The field which will be used to determine the maximum value for any data point', default='max_y')

    args = parser.parse_args()

    make_tiles_from_file(args.input_file, args)
    return;


    with open(args.input_file, 'r') as f:
        entries = json.load(f)

        if args.sort_by is not None:
            # we want the position to be equal to the index of each entry
            # when the whole list is sorted by a certain value
            entries = sorted(entries, key=lambda x: x[args.sort_by])
            for i, entry in enumerate(entries):
                entry['sorted_position'] = i
            args.position = 'sorted_position'

        if args.max_pos is None:
            args.max_pos = max(map(lambda x: x[args.position], entries))
        if args.min_pos is None:
            args.min_pos = min(map(lambda x: x[args.position], entries))

        args.min_y = (min(map(lambda x: float(x[args.min_y]), entries)))
        args.max_y = (max(map(lambda x: float(x[args.max_y]), entries)))

        args.total_x_width = args.max_pos - args.min_pos

        entries = sorted(entries, key= lambda x: -float(x[args.importance]))

        tiles = make_tiles(entries, args, zoom_level = 0, 
                   start_x = args.min_pos, end_x = args.max_pos)

        tileset = {'min_pos': args.min_pos,
                   'max_pos': args.max_pos,
                   'min_y': args.min_y,
                   'max_y': args.max_y,
                   'min_importance': args.min_importance,
                   'max_importance': args.max_importance,
                   'max_zoom': args.max_zoom}

        if not op.exists(args.output_dir):
            os.makedirs(args.output_dir)

        with open(op.join(args.output_dir, 'tile_info.json'), 'w') as f:
            json.dump(tileset, f, indent=2)

        for tile in tiles:
            output_dir = op.join(args.output_dir, str(tile['zoom']))

            if not op.exists(output_dir):
                os.makedirs(output_dir)

            output_file = op.join(output_dir, '{}.json'.format(tile['num']))
            with open(output_file, 'w') as f:
                json.dump(tile, f, indent=2)

if __name__ == '__main__':
    main()


