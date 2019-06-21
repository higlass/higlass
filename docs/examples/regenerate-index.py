#!/usr/bin/env python

import json
import os

def main():
    dir = os.path.dirname(os.path.realpath(__file__))
    viewconfs_dir = os.path.join(dir, 'viewconfs')
    print(json.dumps(
        sorted(os.listdir(viewconfs_dir)),
        indent=2
    ))

if __name__ == '__main__':
    main()
