// @ts-nocheck
/* eslint-env mocha */
import { expect } from 'chai';

// Utils
import { visitPositionedTracks } from '../app/scripts/utils';
import selectedItemsToSize from '../app/scripts/utils/selected-items-to-size';
import selectedItemsToCumWeights from '../app/scripts/utils/selected-items-to-cum-weights';

import { oneViewConfig } from './view-configs';

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

    expect(found).to.equal(true);
    expect(visited).to.equal(6);
  });

  it('should compute size based on an array of selected item indices', () => {
    const selectRows = [1, [2, 3, 4], [5], 6, 7];

    let size;
    size = selectedItemsToSize(selectRows, true);
    expect(size).to.equal(7);

    size = selectedItemsToSize(selectRows, false);
    expect(size).to.equal(5);
  });

  it('should compute cumulative item size weights based on an array of selected item indices', () => {
    const selectRows = [1, [2, 3, 4], [5], 6, 7];

    let weights;
    const delta = 0.01;
    weights = selectedItemsToCumWeights(selectRows, true);
    expect(weights[0]).to.be.closeTo(0.143, delta);
    expect(weights[1]).to.be.closeTo(0.571, delta);
    expect(weights[2]).to.be.closeTo(0.714, delta);
    expect(weights[3]).to.be.closeTo(0.857, delta);
    expect(weights[4]).to.be.closeTo(1, delta);

    weights = selectedItemsToCumWeights(selectRows, false);
    expect(weights[0]).to.be.closeTo(0.2, delta);
    expect(weights[1]).to.be.closeTo(0.4, delta);
    expect(weights[2]).to.be.closeTo(0.6, delta);
    expect(weights[3]).to.be.closeTo(0.8, delta);
    expect(weights[4]).to.be.closeTo(1, delta);
  });
});
