// @ts-nocheck
/* eslint-env mocha */
import { expect } from 'chai';

import createElementAndApi from './utils/create-element-and-api';
import removeDiv from './utils/remove-div';

import overlayAnnotations1d2dViewConf from './view-configs/overlay-annotations-1d-2d.json';
import overlayChromGridViewConf from './view-configs/overlay-chrom-grid.json';

describe('Overlay Track:', () => {
  let hgc = null;
  let api = null;
  let div = null;
  let viewConf;

  describe('Annotation overlays:', () => {
    it('Should render', () => {
      viewConf = overlayAnnotations1d2dViewConf;

      [div, api] = createElementAndApi(viewConf, { bound: true });

      hgc = api.getComponent();

      const numNormalTracks =
        viewConf.views[0].tracks.top.length +
        viewConf.views[0].tracks.right.length +
        viewConf.views[0].tracks.bottom.length +
        viewConf.views[0].tracks.left.length +
        viewConf.views[0].tracks.center.length;

      expect(numNormalTracks).to.deep.equal(4);

      const trackRenderer = hgc.tiledPlots[viewConf.views[0].uid].trackRenderer;

      const posTracks = trackRenderer.props.positionedTracks;

      expect(posTracks.length).to.deep.equal(5);

      const overlayTrack = posTracks[posTracks.length - 1];

      expect(overlayTrack.track.type).to.deep.equal('overlay-track');

      const overlayTrackInfo =
        trackRenderer.trackDefObjects[overlayTrack.track.uid];

      const overlayTrackDef = overlayTrackInfo.trackDef;
      const overlayTrackObj = overlayTrackInfo.trackObject;

      expect(overlayTrack.height).to.be.greaterThan(0);

      expect(overlayTrackDef.width).to.deep.equal(
        overlayTrackObj.dimensions[0],
      );
      expect(overlayTrackDef.height).to.deep.equal(
        overlayTrackObj.dimensions[1],
      );
    });

    afterEach(() => {
      if (api && api.destroy) api.destroy();
      if (div) removeDiv(div);
      api = undefined;
      div = undefined;
    });
  });

  describe('Chromosome grid overlay:', () => {
    it('Should render', (done) => {
      viewConf = overlayChromGridViewConf;

      [div, api] = createElementAndApi(viewConf, { bound: true });

      hgc = api.getComponent();

      const trackRenderer = hgc.tiledPlots[viewConf.views[0].uid].trackRenderer;

      const overlayTrackInfo =
        trackRenderer.trackDefObjects[viewConf.views[0].overlays[0].uid];

      const overlayTrackObj = overlayTrackInfo.trackObject;

      expect(overlayTrackObj.constructor.name).to.deep.equal('ChromosomeGrid');

      hgc.pubSub.subscribe('requestReceived', (url) => {
        if (url === '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv') {
          expect(!!overlayTrackObj.lineGraphics).to.be.equal(true);
          expect(!!overlayTrackObj.lineGraphics1dH).to.be.equal(true);
          expect(!!overlayTrackObj.lineGraphics1dV).to.be.equal(true);
          expect(!!overlayTrackObj.lineGraphics2d).to.be.equal(true);

          done();
        }
      });
    });

    afterEach(() => {
      if (api && api.destroy) api.destroy();
      if (div) removeDiv(div);
      api = undefined;
      div = undefined;
    });
  });
});
