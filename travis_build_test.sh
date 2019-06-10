#!/usr/bin/env bash
set -o errexit

start() { echo travis_fold':'start:$1; echo $1; }
end() { echo travis_fold':'end:$1; }
die() { set +v; echo "$*" 1>&2 ; sleep 1; exit 1; }
# Race condition truncates logs on Travis: "sleep" might help.
# https://github.com/travis-ci/travis-ci/issues/6018

start eslint
./node_modules/eslint/bin/eslint.js karma.conf.js app test
end eslint

start examples
REGEN_SCRIPT='./docs/examples/regenerate-index.py'
INDEX_JSON='docs/examples/index.json'
diff --ignore-space-change <( $REGEN_SCRIPT ) $INDEX_JSON \
  || die "Update fixture index: '$REGEN_SCRIPT > $INDEX_JSON'"
# Compare the output of the regen script to the current index...
# If there's a difference, it will be shown,
# along with a one-liner to fix the problem.
end examples

start compile
npm run compile
[ -e dist.zip ] || die 'Missing dist.zip: Please check that it was produced by npm compile in build.sh.'
end compile

start karma
xvfb-maybe ./node_modules/karma/bin/karma start karma.conf.js --single-run
end karma
