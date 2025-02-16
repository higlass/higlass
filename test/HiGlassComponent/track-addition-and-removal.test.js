// @ts-nocheck
import * as vi from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponent,
  mountHGComponentAsync,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../../app/scripts/utils';

import { testViewConfX2 } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

vi.describe('Track addition and removal', () => {
  let hgc = null;
  let div = null;

  vi.beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, testViewConfX2, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: false,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  vi.afterAll(() => {
    removeHGComponent(div);
  });

  vi.it('should load the initial config', () => {
    // this was to test an example from the higlass-website demo page
    // where the issue was that the genome position search box was being
    // styled with a margin-bottom of 10px, fixed by setting the style of
    // genome-position-search to specify margin-bottom app/styles/GenomePositionSearchBox.css
    vi.expect(hgc.instance().state.views.aa.layout.h).to.equal(6);
  });

  vi.it(
    'should change the opacity of the first text label to 20%',
    async () => {
      const newOptions = JSON.parse(
        JSON.stringify(testViewConfX2.views[0].tracks.top[0].options),
      );
      newOptions.labelTextOpacity = 0.2;

      hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);
      hgc.setState(hgc.instance().state);

      vi.expect(
        getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1').labelText.alpha,
      ).to.be.lessThan(0.21);

      await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
    },
  );

  vi.it('should change the stroke width of the second line to 5', async () => {
    const newOptions = JSON.parse(
      JSON.stringify(testViewConfX2.views[0].tracks.top[1].options),
    );
    newOptions.lineStrokeWidth = 5;

    hgc.instance().handleTrackOptionsChanged('aa', 'line2', newOptions);
    hgc.setState(hgc.instance().state);

    vi.expect(
      getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1').labelText.alpha,
    ).to.be.lessThan(0.21);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  vi.it('should do something else', async () => {
    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
});
