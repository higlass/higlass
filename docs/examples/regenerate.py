#!/usr/bin/env python

import argparse
import json
import os
import re
import requests

def main():
    parser = argparse.ArgumentParser(description='Regenerates example list HTML')
    parser.add_argument('--stdout', action='store_true', help='Dump HTML to STDOUT')
    args = parser.parse_args()
    if not args.stdout:
        parser.print_help()
    else:
        dir = os.path.dirname(os.path.realpath(__file__))

        api_html = get_api_html(dir)
        local_vc_list = get_local_vc_list(dir)
        remote_vc_list = get_remote_vc_list()

        print(template(api_html, local_vc_list, remote_vc_list))

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
    
def get_remote_vc_list():
    gist_url = 'https://gist.githubusercontent.com/pkerpedjiev/104f6c37fbfd0d7d41c73a06010a3b7e/raw/4e65ed9bf8bb1bb24ecaea088bba2d718a18c233'
    remote_vc_examples = requests.get(gist_url).json()
    remote_vc_list = []
    for example in remote_vc_examples:
        remote_vc_list.append({
            'href': example['url'],
            'title': example['title'],
            'viewconf': requests.get(example['url'].replace('/app/?config=', '/api/v1/viewconfs/?d=')).text
        })
    return remote_vc_list
    
def template(api_html, local_vc_list, remote_vc_list):
    return '''
    <html>
    <body>
    <h2>API examples</h2>
    {}

    <h2>Viewconf examples</h2>
    <h3>local</h3>
    {}

    <h3>higlass.io</h3>
    {}

    </body>
    </html>
    '''.format(api_html, list_to_html(local_vc_list), list_to_html(remote_vc_list))
    
def track_types(viewconf_string):
    return sorted(set(match[1] for match in re.finditer(r'"type": "([^"]+)"', viewconf_string)))

def list_to_html(vc_list):
    return '\n'.join([
        '<a href="{}">{}</a>: {}<br>'.format(
          info['href'], info['title'], ' '.join(track_types(info['viewconf']))
        )
        for info in vc_list
    ])
    
if __name__ == '__main__':
    main()
