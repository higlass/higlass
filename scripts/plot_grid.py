#!/usr/bin/python

import json
import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import sys
import argparse

plt.switch_backend('Qt5Agg')

def main():
    parser = argparse.ArgumentParser(description="""
    
    python plot_grid.py grid.json
""")

    parser.add_argument('grid_filename')
    #parser.add_argument('-o', '--options', default='yo',
    #					 help="Some option", type='str')
    #parser.add_argument('-u', '--useless', action='store_true', 
    #					 help='Another useless option')

    args = parser.parse_args()

    with open(args.grid_filename, 'r') as f:
        grid = json.load(f)
        data = []
        counter = 0
        for d in grid['data']:
            try: 
                num = float(d)
            except:
                num = 0
            data += [num]
            counter += 1
        print("counter:", counter)

        data = np.array(data)
        print('dimensions:', grid['dimensions'])
        data = np.nan_to_num(data)
        print('sum:', sum(data))
        data = data.reshape(grid['dimensions'])

        print('data:', data)
        plt.imshow(np.log(data))
        plt.show()
    

if __name__ == '__main__':
    main()


