# HiGlass Docs

Documentation for all HiGlass software ([viewer][hgv], [app][hga], [server][hgs], [docker][hgd])

Simple edits can be made in GitHub. For anything more extensive, preview it locally:
```
git clone https://github.com/higlass/higlass.git
cd higlass/docs
git checkout develop
pip install -r requirements.txt
npm install -g jsdoc
./serve.sh
```

Docs are built and pushed to S3 by Travis.
See [.travis.yml](https://github.com/higlass/higlass/blob/develop/.travis.yml) for details.

[hga]: https://github.com/higlass/higlass-app
[hgd]: https://github.com/higlass/higlass-docker
[hgs]: https://github.com/higlass/higlass-server
[hgv]: https://github.com/higlass/higlass
