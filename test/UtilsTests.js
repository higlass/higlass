/* eslint-env node, jasmine */
import { expect } from 'chai';

// Utils
import {
  visitPositionedTracks
} from '../app/scripts/utils';

import {
  oneViewConfig,
} from './view-configs';

describe('Utils tests', () => {
  it('visitTrack should visit every track', () => {
    // add your tests here
    let found = false;
    let visited = 0;

    visitPositionedTracks(oneViewConfig.views[0].tracks, (track) => {
      if (track.uid === 'c1') {
        found = true;
      }

      visited += 1;
    });

    expect(found).to.eql(true);
    expect(visited).to.eql(5);
  });
});
