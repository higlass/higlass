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

start viewconfs
ls docs/examples/viewconfs/*.json \
  test/view-configs/*.json \
  test/view-configs-more/*.json \
  | sed 's/^/-d /' \
  | xargs npx ajv validate -s app/schema.json --errors=text \
  || die "Invalid viewconf fixtures"
end viewconfs

start compile
npm run compile
[ -e dist.zip ] || die 'Missing dist.zip: Please check that it was produced by npm compile in build.sh.'
end compile

start karma
./node_modules/karma/bin/karma start karma.conf.js --single-run
end karma
