#!/usr/bin/env bash
set -o errexit

start() { echo travis_fold':'start:$1; echo $1; }
end() { echo travis_fold':'end:$1; }
die() { set +v; echo "$*" 1>&2 ; sleep 1; exit 1; }
# Race condition truncates logs on Travis: "sleep" might help.
# https://github.com/travis-ci/travis-ci/issues/6018

start eslint
./node_modules/eslint/bin/eslint.js karma.conf.js
end eslint

start compile
npm run compile
end compile

start karma
xvfb-maybe ./node_modules/karma/bin/karma start karma.conf.js --single-run
end karma