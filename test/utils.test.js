// @ts-nocheck
import * as vi from 'vitest';

// Utils
import { visitPositionedTracks } from '../app/scripts/utils';
import selectedItemsToCumWeights from '../app/scripts/utils/selected-items-to-cum-weights';
import selectedItemsToSize from '../app/scripts/utils/selected-items-to-size';

import { oneViewConfig } from './view-configs';

vi.describe('Utils tests', () => {
  vi.it('visitTrack should visit every track', () => {
    // add your tests here
    let found = false;
    let visited = 0;

    visitPositionedTracks(oneViewConfig.views[0].tracks, (track) => {
      if (track.uid === 'c1') {
        found = true;
      }

      visited += 1;
    });

    vi.expect(found).to.equal(true);
    vi.expect(visited).to.equal(6);
  });

  vi.it(
    'should compute size based on an array of selected item indices',
    () => {
      const selectRows = [1, [2, 3, 4], [5], 6, 7];

      let size;
      size = selectedItemsToSize(selectRows, true);
      vi.expect(size).to.equal(7);

      size = selectedItemsToSize(selectRows, false);
      vi.expect(size).to.equal(5);
    },
  );

  vi.it(
    'should compute cumulative item size weights based on an array of selected item indices',
    () => {
      const selectRows = [1, [2, 3, 4], [5], 6, 7];

      let weights;
      const delta = 0.01;
      weights = selectedItemsToCumWeights(selectRows, true);
      vi.expect(weights[0]).to.be.closeTo(0.143, delta);
      vi.expect(weights[1]).to.be.closeTo(0.571, delta);
      vi.expect(weights[2]).to.be.closeTo(0.714, delta);
      vi.expect(weights[3]).to.be.closeTo(0.857, delta);
      vi.expect(weights[4]).to.be.closeTo(1, delta);

      weights = selectedItemsToCumWeights(selectRows, false);
      vi.expect(weights[0]).to.be.closeTo(0.2, delta);
      vi.expect(weights[1]).to.be.closeTo(0.4, delta);
      vi.expect(weights[2]).to.be.closeTo(0.6, delta);
      vi.expect(weights[3]).to.be.closeTo(0.8, delta);
      vi.expect(weights[4]).to.be.closeTo(1, delta);
    },
  );
});
