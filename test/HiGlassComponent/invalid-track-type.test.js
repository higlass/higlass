// @ts-nocheck
import * as vi from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
} from '../../app/scripts/test-helpers';

import { invalidTrackConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

vi.describe('Division track', () => {
  let hgc = null;
  let div = null;

  vi.beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, invalidTrackConfig, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: false,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  vi.afterAll(async () => {
    removeHGComponent(div);
  });

  vi.it('Opens the track type menu', () => {
    const clickPosition = {
      bottom: 85,
      height: 28,
      left: 246,
      right: 274,
      top: 57,
      width: 28,
      x: 246,
      y: 57,
    };
    const uid = 'line1';

    hgc
      .instance()
      .tiledPlots.aa.handleConfigTrackMenuOpened(uid, clickPosition);
    const cftm = hgc.instance().tiledPlots.aa.configTrackMenu;

    const subMenuRect = {
      bottom: 88,
      height: 27,
      left: 250,
      right: 547.984375,
      top: 61,
      width: 297.984375,
      x: 250,
      y: 61,
    };

    const series = invalidTrackConfig.views[0].tracks.top;

    // get the object corresponding to the series
    cftm.handleItemMouseEnterWithRect(subMenuRect, series[0]);
    const seriesObj = cftm.seriesListMenu;

    const position = { left: 127.03125, top: 84 };
    const bbox = {
      bottom: 104,
      height: 20,
      left: 131.03125,
      right: 246,
      top: 84,
      width: 114.96875,
      x: 131.03125,
      y: 84,
    };

    const trackTypeItems = seriesObj.getTrackTypeItems(position, bbox, series);

    vi.expect(trackTypeItems.props.menuItems.line).to.be.undefined;
    vi.expect(trackTypeItems.props.menuItems.point).to.be.undefined;
  });

  vi.it('Opens the close track menu', () => {
    const clickPosition = {
      bottom: 85,
      height: 28,
      left: 246,
      right: 274,
      top: 57,
      width: 28,
      x: 246,
      y: 57,
    };
    const uid = 'line1';

    hgc.instance().tiledPlots.aa.handleCloseTrackMenuOpened(uid, clickPosition);
  });
});
