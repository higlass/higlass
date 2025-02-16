// @ts-nocheck
import * as vi from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/test-helpers';
import { scalesCenterAndK } from '../../app/scripts/utils';

import { threeViews } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

vi.describe('Three views and linking', () => {
  let hgc = null;
  let div = null;

  vi.beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, threeViews, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  vi.afterAll(() => {
    removeHGComponent(div);
  });

  vi.it('Links two views and moves to the side', async () => {
    hgc.instance().handleLocationLockChosen('aa', 'bb');
    hgc.instance().handleZoomLockChosen('aa', 'bb');

    hgc
      .instance()
      .tiledPlots.aa.trackRenderer.setCenter(
        1799508622.8021536,
        1801234331.7949603,
        17952.610495328903,
      );
    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  vi.it(
    'Checks to make sure that the two views have moved to the same place',
    () => {
      const aaXScale = hgc.instance().xScales.aa;
      const aaYScale = hgc.instance().yScales.aa;

      const bbXScale = hgc.instance().xScales.bb;
      const bbYScale = hgc.instance().yScales.bb;

      const [aaCenterX, aaCenterY] = scalesCenterAndK(aaXScale, aaYScale);
      const [bbCenterX, bbCenterY] = scalesCenterAndK(bbXScale, bbYScale);

      vi.expect(aaCenterX - bbCenterX).to.be.lessThan(0.001);
      vi.expect(aaCenterY - bbCenterY).to.be.lessThan(0.001);
    },
  );

  vi.it('Links the third view', async () => {
    hgc.instance().handleLocationYanked('cc', 'aa');
    hgc.instance().handleZoomYanked('cc', 'aa');

    hgc.instance().handleLocationLockChosen('bb', 'cc');
    hgc.instance().handleZoomLockChosen('bb', 'cc');

    hgc
      .instance()
      .tiledPlots.aa.trackRenderer.setCenter(
        1799509622.8021536,
        1801244331.7949603,
        17952.610495328903,
      );

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  vi.it('Makes sure that the third view moved', async () => {
    const aaXScale = hgc.instance().xScales.aa;
    const aaYScale = hgc.instance().yScales.aa;

    const ccXScale = hgc.instance().xScales.cc;
    const ccYScale = hgc.instance().yScales.cc;

    const [aaCenterX, aaCenterY] = scalesCenterAndK(aaXScale, aaYScale);
    const [ccCenterX, ccCenterY] = scalesCenterAndK(ccXScale, ccYScale);

    vi.expect(aaCenterX - ccCenterX).to.be.lessThan(0.001);
    vi.expect(aaCenterY - ccCenterY).to.be.lessThan(0.001);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
});
