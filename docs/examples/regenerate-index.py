#!/usr/bin/env python

import json
import os
from sys import argv, exit

def main(dirs):
    not_dirs = [f for f in dirs if not os.path.isdir(f)]
    if not_dirs:
        exit('All arguments must be directories; These are not: {}'.format(not_dirs))
    if len(dirs) == 0:
        exit('Expects at least one directory argument.')
    index_filename = '_index.json'
    for dir in dirs:
        with open(os.path.join(dir, index_filename), 'w') as output:
            files = sorted([f for f in os.listdir(dir) if f != index_filename])
            output.write(json.dumps(files, indent=2))

if __name__ == '__main__':
    main(argv[1:])
