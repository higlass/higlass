// @ts-nocheck
import * as vi from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
  waitForJsonComplete,
  waitForTilesLoaded,
  waitForTransitionsFinished,
} from '../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../app/scripts/utils';
import viewConf from './view-configs/simple-heatmap-gene-annotations.json';

Enzyme.configure({ adapter: new Adapter() });

vi.describe('View Config Editor', () => {
  let hgc = null;
  let div = null;

  vi.beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, viewConf, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  vi.afterAll(() => {
    removeHGComponent(div);
  });

  vi.it('should instantiate and open', async () => {
    hgc.instance().handleEditViewConfigBound();
    hgc.update();

    vi.expect(hgc.instance().modalRef).to.exist;

    await new Promise((done) => waitForJsonComplete(done));
  });

  vi.it('should focus the textarea', () => {
    vi.expect(hgc.instance().modalRef.editorWrap.scrollTop).to.equal(0);
    vi.expect(document.activeElement).to.equal(
      hgc.instance().modalRef.editor._input,
    );
  });

  vi.it('view config should be updated on cmd+s', () => {
    const originalViewConf = JSON.stringify(hgc.instance().state.viewConfig);
    const newViewConf = JSON.parse(originalViewConf);
    newViewConf.views[0].tracks.top[0].height = 30;

    hgc.instance().modalRef.handleChange(JSON.stringify(newViewConf));
    hgc.update();

    // No changes should have happened yet
    vi.expect(
      hgc.instance().state.viewConfig.views[0].tracks.top[0].height,
    ).to.equal(60);

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 's', metaKey: true }),
    );
    hgc.update();

    // No changes should now be reflected
    vi.expect(
      hgc.instance().state.viewConfig.views[0].tracks.top[0].height,
    ).to.equal(30);
  });

  vi.it('should revert changes and close on escape', () => {
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));
    hgc.update();

    // Modal should be closed
    vi.expect(hgc.instance().modalRef).to.be.not.ok;
    // No changes should be reverted
    vi.expect(
      hgc.instance().state.viewConfig.views[0].tracks.top[0].height,
    ).to.equal(60);
  });

  vi.it('open again', async () => {
    hgc.instance().handleEditViewConfigBound();
    hgc.update();

    vi.expect(hgc.instance().modalRef).to.be.ok;

    await new Promise((done) => waitForJsonComplete(done));
  });

  vi.it('should save changes and close on cmd+enter', () => {
    const originalViewConf = JSON.stringify(hgc.instance().state.viewConfig);
    const newViewConf = JSON.parse(originalViewConf);
    newViewConf.views[0].tracks.top[0].height = 30;

    hgc.instance().modalRef.handleChange(JSON.stringify(newViewConf));
    hgc.update();

    // No changes should have happened yet
    vi.expect(
      hgc.instance().state.viewConfig.views[0].tracks.top[0].height,
    ).to.equal(60);

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', metaKey: true }),
    );
    hgc.update();

    // Modal should be closed
    vi.expect(hgc.instance().modalRef).to.be.not.ok;

    // No changes should now be reflected
    vi.expect(
      hgc.instance().state.viewConfig.views[0].tracks.top[0].height,
    ).to.equal(30);
  });

  vi.it('zoom somewhere', async () => {
    hgc
      .instance()
      .zoomTo('a', 1000000000, 2000000000, 1000000000, 2000000000, 1000);

    await new Promise((done) => {
      waitForTransitionsFinished(hgc.instance(), () => {
        waitForTilesLoaded(hgc.instance(), () => {
          done(null);
        });
      });
    });
  });

  vi.it('open editor again, do nothing and save', async () => {
    hgc.instance().handleEditViewConfigBound();
    hgc.update();

    vi.expect(hgc.instance().modalRef).to.be.ok;

    await new Promise((done) => waitForJsonComplete(done));

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', metaKey: true }),
    );
    hgc.update();

    // Modal should be closed
    vi.expect(hgc.instance().modalRef).to.be.not.ok;
  });

  vi.it('Heatmap track should not have moved', () => {
    const initialXDomain =
      hgc.instance().state.viewConfig.views[0].initialXDomain;
    const trackObject = getTrackObjectFromHGC(hgc.instance(), 'heatmap');

    vi.expect(
      Math.round(trackObject._xScale.domain()[0] - initialXDomain[0]),
    ).to.equal(0);
    vi.expect(
      Math.round(trackObject._xScale.domain()[1] - initialXDomain[1]),
    ).to.equal(0);
  });
});
