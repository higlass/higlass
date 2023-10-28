// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import {
  mountHGComponent,
  removeHGComponent,
} from '../../app/scripts/test-helpers';
import { getTrackByUid } from '../../app/scripts/utils';

import { oneTrackConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Track type menu tests', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, oneTrackConfig, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
  });

  it('Opens the track type menu', () => {
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

    const { views } = hgc.instance().state;
    const series = getTrackByUid(views.aa.tracks, 'line1');

    // get the object corresponding to the series
    cftm.handleItemMouseEnterWithRect(subMenuRect, series);
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

    const validSeries = getTrackByUid(views.aa.tracks, 'line1');
    const trackTypeItems = seriesObj.getTrackTypeItems(
      position,
      bbox,
      validSeries,
    );

    expect(trackTypeItems.props.menuItems.line).to.exist;
    expect(trackTypeItems.props.menuItems.point).to.exist;
  });

  it('Changes the track type', () => {
    // make sure that this doesn't error
    hgc.instance().tiledPlots.aa.handleChangeTrackType('line1', 'bar');

    // make sure that the uid of the top track has been changed
    expect(hgc.instance().state.views.aa.tracks.top[0].uid).not.to.equal(
      'line1',
    );
    expect(hgc.instance().state.views.aa.tracks.top[0].type).to.equal('bar');
  });
});
