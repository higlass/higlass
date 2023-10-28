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

import { annotationsTilesView } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Track types', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, annotationsTilesView, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
  });

  it('Ensures that only the gene-annotations and 1d-tiles tracks are listed', () => {
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
    const uid = 'track1';

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
    const series = getTrackByUid(views.aa.tracks, 'track1');

    // get the object corresponding to the series
    cftm.handleItemMouseEnterWithRect(subMenuRect, series);
    const seriesObj = cftm.seriesListMenu;

    const position = { left: 679.421875, top: 86 };
    const bbox = {
      x: 463.703125,
      y: 86,
      width: 124.4375,
      height: 21,
      top: 86,
      right: 588.140625,
      bottom: 107,
      left: 463.703125,
    };

    const trackTypeItems = seriesObj.getTrackTypeItems(position, bbox, series);

    expect(trackTypeItems.props.menuItems['gene-annotations']).to.exist;
    expect(trackTypeItems.props.menuItems['horizontal-1d-tiles']).to.exist;
    expect(trackTypeItems.props.menuItems.line).to.be.undefined;
  });
});
