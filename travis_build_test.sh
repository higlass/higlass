#!/usr/bin/env bash
set -o errexit

start() { echo travis_fold':'start:$1; echo $1; }
end() { echo travis_fold':'end:$1; }
die() { set +v; echo "$*" 1>&2 ; sleep 1; exit 1; }
# Race condition truncates logs on Travis: "sleep" might help.
# https://github.com/travis-ci/travis-ci/issues/6018

start eslint
# We want to enforce some minimal standards across the board,
# while we work to get individual files up to something higher.
./node_modules/eslint/bin/eslint.js \
  --ignore-path .eslintignore-minimal \
  --config .eslintrc-minimal app test || die 'Low-bar horizontal linting failed'
./node_modules/eslint/bin/eslint.js \
  karma.conf.js \
  app/scripts/configs \
  app/scripts/factories \
  app/scripts/HeatmapTiledPixiTrack.js \
  app/scripts/services \
  app/scripts/*Track.js \
  app/scripts/utils \
  test || die 'High-bar vertical linting failed'
end eslint

start compile
npm run compile
[ -e dist.zip ] || die 'Missing dist.zip: Please check that it was produced by npm compile in build.sh.'
end compile

start karma
xvfb-maybe ./node_modules/karma/bin/karma start karma.conf.js --single-run
end karma
