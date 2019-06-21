#!/usr/bin/env bash
set -o errexit

start() { echo travis_fold':'start:$1; echo $1; }
end() { echo travis_fold':'end:$1; }
die() { set +v; echo "$*" 1>&2 ; sleep 1; exit 1; }
# Race condition truncates logs on Travis: "sleep" might help.
# https://github.com/travis-ci/travis-ci/issues/6018

# start eslint
# ./node_modules/eslint/bin/eslint.js karma.conf.js app test
# end eslint

start viewconfs
CMD='./docs/examples/regenerate-index.py docs/examples/viewconfs'
$CMD
git diff --ignore-all-space --exit-code \
  || die "viewconf fixtures changed. To regenerate: $CMD"
for F in docs/examples/viewconfs/* \
         test/view-configs/* \
         test/view-configs-more/*
  do [[ `basename "$F"` == '_index.json' ]] \
    || npx ajv validate -s app/schema.json -d $F \
    || die "Invalid viewconf"
done
end viewconfs

start compile
npm run compile
[ -e dist.zip ] || die 'Missing dist.zip: Please check that it was produced by npm compile in build.sh.'
end compile

start karma
xvfb-maybe ./node_modules/karma/bin/karma start karma.conf.js --single-run
end karma
