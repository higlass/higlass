// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import {
  mountHGComponent,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/test-helpers';
import { scalesCenterAndK } from '../../app/scripts/utils';

import { threeViews } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Three views and linking', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, threeViews, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
  });

  it('Links two views and moves to the side', (done) => {
    hgc.instance().handleLocationLockChosen('aa', 'bb');
    hgc.instance().handleZoomLockChosen('aa', 'bb');

    hgc
      .instance()
      .tiledPlots.aa.trackRenderer.setCenter(
        1799508622.8021536,
        1801234331.7949603,
        17952.610495328903,
      );
    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Checks to make sure that the two views have moved to the same place', () => {
    const aaXScale = hgc.instance().xScales.aa;
    const aaYScale = hgc.instance().yScales.aa;

    const bbXScale = hgc.instance().xScales.bb;
    const bbYScale = hgc.instance().yScales.bb;

    const [aaCenterX, aaCenterY] = scalesCenterAndK(aaXScale, aaYScale);
    const [bbCenterX, bbCenterY] = scalesCenterAndK(bbXScale, bbYScale);

    expect(aaCenterX - bbCenterX).to.be.lessThan(0.001);
    expect(aaCenterY - bbCenterY).to.be.lessThan(0.001);
  });

  it('Links the third view', (done) => {
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

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Makes sure that the third view moved', (done) => {
    const aaXScale = hgc.instance().xScales.aa;
    const aaYScale = hgc.instance().yScales.aa;

    const ccXScale = hgc.instance().xScales.cc;
    const ccYScale = hgc.instance().yScales.cc;

    const [aaCenterX, aaCenterY] = scalesCenterAndK(aaXScale, aaYScale);
    const [ccCenterX, ccCenterY] = scalesCenterAndK(ccXScale, ccYScale);

    expect(aaCenterX - ccCenterX).to.be.lessThan(0.001);
    expect(aaCenterY - ccCenterY).to.be.lessThan(0.001);

    waitForTilesLoaded(hgc.instance(), done);
  });
});
