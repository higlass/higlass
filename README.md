# HiGlass Docs

> Documentation for all HiGlass software ([viewer][hgv], [app][hga], [server][hgs], [docker][hgd])

[![HiGlass](https://img.shields.io/badge/higlass-👍-red.svg?colorB=0f5d92)](http://higlass.io)
[![Live Docs](https://img.shields.io/badge/docs-live-red.svg?colorB=0f5d92)](https://hms-dbmi.github.io/higlass-docs/)

Compiling: `./build.sh` or

```
sphinx-build -b html . _build/html
```

Serving: `./serve.sh` or

```
cd _build/html; python -m http.server 8081
```

[hga]: https://github.com/hms-dbmi/higlass-app
[hgd]: https://github.com/hms-dbmi/higlass-docker
[hgs]: https://github.com/hms-dbmi/higlass-server
[hgv]: https://github.com/hms-dbmi/higlass
