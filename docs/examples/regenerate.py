import os
import requests
import json
import re

dir = os.path.dirname(os.path.realpath(__file__))

api_examples = os.listdir(os.path.join(dir, 'apis'))
api_html = '\n'.join(['<a href="apis/{0}">{0}</a><br>'.format(file) for file in api_examples])

local_vc = os.listdir(os.path.join(dir, 'viewconfs'))
local_vc_dict = {}
for vc in local_vc:
    with open(os.path.join(dir, 'viewconfs', vc)) as f:
        local_vc_dict[vc] = f.read()
local_vc_html = '\n'.join([
    '<a href="apis/svg.html?/viewconfs/{0}">{0}</a>: {1}<br>'.format(
      filename, ' '.join(set(match[1] for match in re.finditer(r'"type": "([^"]+)"', viewconf)))
    )
    for filename, viewconf in local_vc_dict.items()
])

gist_url = 'https://gist.githubusercontent.com/pkerpedjiev/104f6c37fbfd0d7d41c73a06010a3b7e/raw/4e65ed9bf8bb1bb24ecaea088bba2d718a18c233'
remote_vc = requests.get(gist_url).json()
remote_vc_html = '\n'.join([
    '<a href="apis/svg.html?{}">{}</a><br>'.format(ex['url'], ex['title']) 
    for ex in remote_vc
])

print('''
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
'''
.format(api_html, local_vc_html, remote_vc_html))