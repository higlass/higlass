// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import {
  mountHGComponent,
  removeHGComponent,
  waitForTransitionsFinished,
  waitForTilesLoaded,
  waitForJsonComplete,
} from '../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../app/scripts/utils';
import viewConf from './view-configs/simple-heatmap-gene-annotations.json';

Enzyme.configure({ adapter: new Adapter() });

describe('View Config Editor', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, viewConf, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  it('should instantiate and open', (done) => {
    hgc.instance().handleEditViewConfigBound();
    hgc.update();

    expect(hgc.instance().modalRef).to.exist;

    waitForJsonComplete(done);
  });

  it('should focus the textarea', () => {
    expect(hgc.instance().modalRef.editorWrap.scrollTop).to.equal(0);
    expect(document.activeElement).to.equal(
      hgc.instance().modalRef.editor._input,
    );
  });

  it('view config should be updated on cmd+s', () => {
    const originalViewConf = JSON.stringify(hgc.instance().state.viewConfig);
    const newViewConf = JSON.parse(originalViewConf);
    newViewConf.views[0].tracks.top[0].height = 30;

    hgc.instance().modalRef.handleChange(JSON.stringify(newViewConf));
    hgc.update();

    // No changes should have happened yet
    expect(
      hgc.instance().state.viewConfig.views[0].tracks.top[0].height,
    ).to.equal(60);

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 's', metaKey: true }),
    );
    hgc.update();

    // No changes should now be reflected
    expect(
      hgc.instance().state.viewConfig.views[0].tracks.top[0].height,
    ).to.equal(30);
  });

  it('should revert changes and close on escape', () => {
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));
    hgc.update();

    // Modal should be closed
    expect(hgc.instance().modalRef).to.be.not.ok;
    // No changes should be reverted
    expect(
      hgc.instance().state.viewConfig.views[0].tracks.top[0].height,
    ).to.equal(60);
  });

  it('open again', (done) => {
    hgc.instance().handleEditViewConfigBound();
    hgc.update();

    expect(hgc.instance().modalRef).to.be.ok;

    waitForJsonComplete(done);
  });

  it('should save changes and close on cmd+enter', () => {
    const originalViewConf = JSON.stringify(hgc.instance().state.viewConfig);
    const newViewConf = JSON.parse(originalViewConf);
    newViewConf.views[0].tracks.top[0].height = 30;

    hgc.instance().modalRef.handleChange(JSON.stringify(newViewConf));
    hgc.update();

    // No changes should have happened yet
    expect(
      hgc.instance().state.viewConfig.views[0].tracks.top[0].height,
    ).to.equal(60);

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', metaKey: true }),
    );
    hgc.update();

    // Modal should be closed
    expect(hgc.instance().modalRef).to.be.not.ok;

    // No changes should now be reflected
    expect(
      hgc.instance().state.viewConfig.views[0].tracks.top[0].height,
    ).to.equal(30);
  });

  it('zoom somewhere', (done) => {
    hgc
      .instance()
      .zoomTo('a', 1000000000, 2000000000, 1000000000, 2000000000, 1000);

    waitForTransitionsFinished(hgc.instance(), () => {
      waitForTilesLoaded(hgc.instance(), () => {
        done();
      });
    });
  });

  it('open editor again, do nothing and save', (done) => {
    hgc.instance().handleEditViewConfigBound();
    hgc.update();

    expect(hgc.instance().modalRef).to.be.ok;

    waitForJsonComplete(done);

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', metaKey: true }),
    );
    hgc.update();

    // Modal should be closed
    expect(hgc.instance().modalRef).to.be.not.ok;
  });

  it('Heatmap track should not have moved', () => {
    const initialXDomain =
      hgc.instance().state.viewConfig.views[0].initialXDomain;
    const trackObject = getTrackObjectFromHGC(hgc.instance(), 'heatmap');

    expect(
      Math.round(trackObject._xScale.domain()[0] - initialXDomain[0]),
    ).to.equal(0);
    expect(
      Math.round(trackObject._xScale.domain()[1] - initialXDomain[1]),
    ).to.equal(0);
  });

  after(() => {
    removeHGComponent(div);
  });
});
