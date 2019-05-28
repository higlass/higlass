#!/usr/bin/env python

import argparse
import json
import os
import re
import requests

def main():
    parser = argparse.ArgumentParser(description='Regenerates example list HTML')
    parser.add_argument('--stdout', action='store_true', help='Dump HTML to STDOUT')
    parser.add_argument('--local', action='store_true', help='Do not make HTTP requests')
    args = parser.parse_args()
    if not args.stdout:
        parser.print_help()
    else:
        dir = os.path.dirname(os.path.realpath(__file__))

        api_html = get_api_html(dir)
        local_vc_list = get_local_vc_list(dir)
        remote_vc_list = get_remote_vc_list(args.local)
        
        all_track_types = tracktypes_from_vc_list(local_vc_list + remote_vc_list)

        print(template(api_html, all_track_types, local_vc_list, remote_vc_list))

def get_api_html(dir):
    api_examples = os.listdir(os.path.join(dir, 'apis'))
    return '\n'.join(['<a href="apis/{0}">{0}</a><br>'.format(file) for file in api_examples])

def get_local_vc_list(dir):
    local_vc_files = os.listdir(os.path.join(dir, 'viewconfs'))
    local_vc_list = []
    for filename in local_vc_files:
        with open(os.path.join(dir, 'viewconfs', filename)) as f:
            local_vc_list.append({
                'href': 'apis/svg.html?/viewconfs/{}'.format(filename),
                'title': filename,
                'viewconf': f.read()
            })
    return local_vc_list
    
def get_remote_vc_list(skip):
    if skip:
        return []
    gist_url = 'https://gist.githubusercontent.com/pkerpedjiev/104f6c37fbfd0d7d41c73a06010a3b7e/raw/4e65ed9bf8bb1bb24ecaea088bba2d718a18c233'
    remote_vc_examples = requests.get(gist_url).json()
    remote_vc_list = []
    for example in remote_vc_examples:
        viewconf = requests.get(example['url'].replace('/app/?config=', '/api/v1/viewconfs/?d=')).text
        remote_vc_list.append({
            'href': example['url'],
            'title': example['title'],
            'viewconf': viewconf
        })
    return remote_vc_list
    
def tracktypes_from_vc_list(vc_list):
    tracktypes = [track_types(vc['viewconf']) for vc in vc_list]
    return sorted(set.union(*tracktypes))
    
def template(api_html, all_track_types, local_vc_list, remote_vc_list):
    # https://css-tricks.com/rotated-table-column-headers/
    css = '''
    th {
      height: 140px;
      white-space: nowrap;
    }
    th > div {
      transform: 
        translate(0px, 51px)
        rotate(-45deg);
      width: 30px;
    }
    tr:hover {
      background-color: lightgrey;
    }
    '''
    return '''
    <html>
    <head><style>{}</style></head>
    <body>
    <h2>API examples</h2>
    {}

    <h2>Viewconf examples</h2>
    <table>
    {}
    <tr><td>local</td></tr>
    {}
    <tr><td>higlass.io</td></tr>
    {}
    </table>

    </body>
    </html>
    '''.format(
        css,
        api_html, tracktypes_header_html(all_track_types),
        list_to_html(local_vc_list, all_track_types),
        list_to_html(remote_vc_list, all_track_types)
    )
    
def track_types(viewconf_string):
    return set(match[1] for match in re.finditer(r'"type": "([^"]+)"', viewconf_string))

def tracktypes_header_html(tracktypes):
    return '<tr><td></td>{}</tr>'.format(''.join([
        '<th><div>{}</div></th>'.format(t)
        for t in tracktypes
    ]))

def list_to_html(vc_list, all_track_types):
    return '\n'.join([
        '<tr><td><a href="{}">{}</a></td>{}</tr>'.format(
          info['href'], info['title'],
          ''.join(['<td>{}</td>'.format('X' if t in track_types(info['viewconf']) else '') for t in all_track_types])
        )
        for info in vc_list
    ])
    
if __name__ == '__main__':
    main()
