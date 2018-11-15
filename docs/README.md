# HiGlass Docs

> Documentation for all HiGlass software ([viewer][hgv], [app][hga], [server][hgs], [docker][hgd])

[![HiGlass](https://img.shields.io/badge/higlass-👍-blue.svg)](http://higlass.io)
[![Current Release Docs](https://img.shields.io/badge/docs-blue.svg)](http://docs.higlass.io/)
[![Next Release Docs](https://img.shields.io/badge/dev-docs-blue.svg)](http://dev-docs.higlass.io/)

GitHub Pages hosts the documentation sites, so to make the docs for both the current release and the next release accessible,
we have two repos, [`higlass-docs`](https://github.com/higlass/higlass-docs) and
[`higlass-docs-dev`](https://github.com/higlass/higlass-docs-dev).
Generally, commits should only be made to `higlass-docs-dev`, and when we want to release a batch of edits,
we push to a remote for `higlass-docs`.

For the time being, after making any edits, the documention should be rebuilt with `./build.sh`,
and the built files should be part of the commit.

For a local preview, run `./serve.sh`.

[hga]: https://github.com/higlass/higlass-app
[hgd]: https://github.com/higlass/higlass-docker
[hgs]: https://github.com/higlass/higlass-server
[hgv]: https://github.com/higlass/higlass
