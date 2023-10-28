// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

// Utils
import {
  mountHGComponent,
  removeHGComponent,
  waitForTransitionsFinished,
  waitForTilesLoaded,
} from '../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../app/scripts/utils';

import viewConf1DHorizontal from './view-configs/continuous-scaling-1D-horizontal.json';
import viewConf1DVertical from './view-configs/continuous-scaling-1D-vertical.json';
import viewConf2D from './view-configs/continuous-scaling-2D.json';

import DenseDataExtrema1D from '../app/scripts/utils/DenseDataExtrema1D';
import DenseDataExtrema2D from '../app/scripts/utils/DenseDataExtrema2D';
import { vecToy, vecRealistic } from './testdata/vector-data';
import { matToy, matRealistic } from './testdata/matrix-data';

Enzyme.configure({ adapter: new Adapter() });

describe('Dense data extrema tests', () => {
  // We can pass in the view conf as first argument to perform some
  // basic compatibility checks. Since we have two view confs here, we skip this.

  describe('DenseDataExtrema module', () => {
    it('should get precise extrema of toy vectors', () => {
      const dde = new DenseDataExtrema1D(vecToy);

      expect(dde.minNonZeroInTile).to.eql(1);
      expect(dde.maxNonZeroInTile).to.eql(63);

      expect(dde.getMinNonZeroInSubset([0, 1])).to.eql(Number.MAX_SAFE_INTEGER);

      expect(dde.getMinNonZeroInSubset([10, 33])).to.eql(10);
      expect(dde.getMaxNonZeroInSubset([10, 33])).to.eql(32);
      expect(dde.getMinNonZeroInSubset([21, 64])).to.eql(21);
      expect(dde.getMaxNonZeroInSubset([21, 64])).to.eql(63);
    });

    it('should get precise extrema of realistic vectors', () => {
      const dde = new DenseDataExtrema1D(vecRealistic);

      expect(dde.minNonZeroInTile).to.eql(0.0004627704620361328);
      expect(dde.maxNonZeroInTile).to.eql(0.075439453125);

      expect(dde.getMinNonZeroInSubset([76, 771])).to.eql(
        0.0009503364562988281,
      );
      expect(dde.getMaxNonZeroInSubset([76, 771])).to.eql(0.01194000244140625);
    });

    it('should get approximate extrema of toy matrix', () => {
      const dde = new DenseDataExtrema2D(matToy);

      expect(dde.minNonZeroInTile).to.eql(1);
      expect(dde.maxNonZeroInTile).to.eql(255);

      expect(dde.getMinNonZeroInSubset([0, 0, 1, 1])).to.eql(1);
      expect(dde.getMaxNonZeroInSubset([0, 0, 1, 1])).to.eql(17);

      expect(dde.getMinNonZeroInSubset([0, 2, 2, 5])).to.eql(32);
      expect(dde.getMaxNonZeroInSubset([0, 2, 2, 5])).to.eql(83);
    });

    it('should get approximate extrema of realistic matrix', () => {
      const dde = new DenseDataExtrema2D(matRealistic);

      expect(dde.minNonZeroInTile).to.eql(1);
      expect(dde.maxNonZeroInTile).to.eql(5748);

      expect(dde.getMinNonZeroInSubset([28, 40, 250, 120])).to.eql(1);
      expect(dde.getMaxNonZeroInSubset([28, 40, 250, 120])).to.eql(196);
    });
  });

  describe('Precise scaling of horizontal 1D tracks', () => {
    let hgc = null;
    let div = null;

    before((done) => {
      [div, hgc] = mountHGComponent(div, hgc, viewConf1DHorizontal, done, {
        extendedDelay: 1000, // additional delay in ms
      });
    });

    it('Ensures HorizontalPoint1DPixiTrack has correct scale', () => {
      const trackObj = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf1DHorizontal.views[0].uid,
        viewConf1DHorizontal.views[0].tracks.top[0].uid,
      );

      const vs = trackObj.valueScale.domain();
      expect(vs[0]).to.be.eql(10.96875);
      expect(vs[1]).to.be.eql(14800);
    });

    it('Ensures Horizontal1DHeatmapTrack has correct scale', () => {
      const trackObj = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf1DHorizontal.views[0].uid,
        viewConf1DHorizontal.views[0].tracks.top[1].uid,
      );

      const vs = trackObj.valueScale.domain();
      expect(vs[0]).to.be.eql(0.12999966740608215);
      expect(vs[1]).to.be.eql(0.3573390543460846);
    });

    it('Ensures HorizontalLine1DPixiTrack has correct scale', () => {
      const trackObj = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf1DHorizontal.views[0].uid,
        viewConf1DHorizontal.views[0].tracks.top[2].uid,
      );

      const vs = trackObj.valueScale.domain();
      expect(vs[0]).to.be.eql(11);
      expect(vs[1]).to.be.eql(12081);
    });

    it('Ensures valuescale locked BarTracks with ignoreOffScreenValue have correct scale', () => {
      const trackObj1 = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf1DHorizontal.views[0].uid,
        viewConf1DHorizontal.views[0].tracks.top[3].uid,
      );

      const trackObj2 = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf1DHorizontal.views[0].uid,
        viewConf1DHorizontal.views[0].tracks.top[4].uid,
      );

      const vs1 = trackObj1.valueScale.domain();
      const vs2 = trackObj2.valueScale.domain();
      expect(vs1[0]).to.be.eql(1.0107421875);
      expect(vs1[1]).to.be.eql(4.7421875);
      expect(vs2[0]).to.be.eql(1.0107421875);
      expect(vs2[1]).to.be.eql(4.7421875);
    });

    it('Ensures valuescale locked BarTrack and LineTrack without ignoreOffScreenValue have correct scale', () => {
      const trackObj1 = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf1DHorizontal.views[0].uid,
        viewConf1DHorizontal.views[0].tracks.top[5].uid,
      );

      const trackObj2 = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf1DHorizontal.views[0].uid,
        viewConf1DHorizontal.views[0].tracks.top[6].uid,
      );

      const vs1 = trackObj1.valueScale.domain();
      const vs2 = trackObj2.valueScale.domain();
      expect(vs1[0]).to.be.eql(0.004180908203125);
      expect(vs1[1]).to.be.eql(0.15536139905452728);
      expect(vs2[0]).to.be.eql(0.004180908203125);
      expect(vs2[1]).to.be.eql(0.15536139905452728);
    });

    it('Zooms and pan to the right', (done) => {
      hgc.instance().zoomTo('aa', 2619000000, 2620000000);

      waitForTransitionsFinished(hgc.instance(), () => {
        waitForTilesLoaded(hgc.instance(), () => {
          done();
        });
      });
    });

    it('Ensures HorizontalPoint1DPixiTrack has correct scale after zooming', () => {
      const trackObj = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf1DHorizontal.views[0].uid,
        viewConf1DHorizontal.views[0].tracks.top[0].uid,
      );

      const vs = trackObj.valueScale.domain();
      expect(vs[0]).to.be.eql(4.39453125);
      expect(vs[1]).to.be.eql(2194);
    });

    it('Ensures Horizontal1DHeatmapTrack has correct scale after zooming', () => {
      const trackObj = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf1DHorizontal.views[0].uid,
        viewConf1DHorizontal.views[0].tracks.top[1].uid,
      );

      const vs = trackObj.valueScale.domain();
      expect(vs[0]).to.be.eql(0.12999965250492096);
      expect(vs[1]).to.be.eql(0.6042279601097107);
    });

    it('Ensures HorizontalLine1DPixiTrack has correct scale after zooming', () => {
      const trackObj = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf1DHorizontal.views[0].uid,
        viewConf1DHorizontal.views[0].tracks.top[2].uid,
      );

      const vs = trackObj.valueScale.domain();

      expect(vs[0]).to.be.eql(180);
      expect(vs[1]).to.be.eql(91032);
    });

    after(() => {
      removeHGComponent(div);
    });
  });

  describe('Precise scaling of vertical 1D tracks', () => {
    let hgc = null;
    let div = null;

    before((done) => {
      [div, hgc] = mountHGComponent(div, hgc, viewConf1DVertical, done, {
        extendedDelay: 1000, // additional delay in ms
      });
    });

    it('Ensures leftmodified HorizontalPoint1DPixiTrack has correct scale', () => {
      const trackObj = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf1DVertical.views[0].uid,
        viewConf1DVertical.views[0].tracks.left[0].uid,
      ).originalTrack;

      waitForTilesLoaded(hgc.instance(), () => {
        const vs = trackObj.valueScale.domain();
        expect(vs[0]).to.be.eql(4308);
        expect(vs[1]).to.be.eql(33920);
      });
    });

    it('Ensures valuescale locked leftmodified BarTracks with ignoreOffScreenValue have correct scale', () => {
      const trackObj1 = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf1DVertical.views[0].uid,
        viewConf1DVertical.views[0].tracks.right[0].uid,
      ).originalTrack;

      const trackObj2 = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf1DVertical.views[0].uid,
        viewConf1DVertical.views[0].tracks.right[1].uid,
      ).originalTrack;

      const vs1 = trackObj1.valueScale.domain();
      const vs2 = trackObj2.valueScale.domain();

      expect(vs1[0]).to.be.eql(0.0009598731994628906);
      expect(vs1[1]).to.be.eql(1.5029296875);
      expect(vs2[0]).to.be.eql(0.0009598731994628906);
      expect(vs2[1]).to.be.eql(1.5029296875);
    });

    after(() => {
      removeHGComponent(div);
    });
  });

  describe('Correct scaling of 2D tracks', () => {
    let hgc = null;
    let div = null;

    before((done) => {
      [div, hgc] = mountHGComponent(div, hgc, viewConf2D, done, {
        style: 'width:600px; height:600px; background-color: lightgreen',
        bounded: true,
        extendedDelay: 1000,
      });
    });

    it('Ensures Heatmap track has correct scale', () => {
      const trackObj = getTrackObjectFromHGC(
        hgc.instance(),
        viewConf2D.views[0].uid,
        viewConf2D.views[0].tracks.center[0].uid,
      ).childTracks[0];

      waitForTilesLoaded(hgc.instance(), () => {
        const vs = trackObj.valueScale.domain();

        expect(vs[0]).to.be.eql(0.0014894568594172597);
        expect(vs[1]).to.be.eql(0.9345257878303528);
      });
    });

    it('Pan to the right', (done) => {
      hgc.instance().zoomTo('aa', 1000000, 1250000, 0, 250000, 1000);

      waitForTransitionsFinished(hgc.instance(), () => {
        waitForTilesLoaded(hgc.instance(), () => {
          done();
        });
      });
    });

    // disabled to fix tests in PR #978
    // it('Ensures Heatmap track has correct scale after zoom', () => {
    //   const trackObj = getTrackObjectFromHGC(
    //     hgc.instance(),
    //     viewConf2D.views[0].uid,
    //     viewConf2D.views[0].tracks.center[0].uid
    //   ).childTracks[0];

    //   waitForTilesLoaded(hgc.instance(), () => {
    //     const vs = trackObj.valueScale.domain();

    //     expect(vs[0]).to.be.eql(0.0017257321160286665);
    //     expect(vs[1]).to.be.eql(0.01572374626994133);
    //   });
    // });

    after(() => {
      removeHGComponent(div);
    });
  });
});
