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
import { getTrackObjectFromHGC } from '../../app/scripts/utils';

import { oneViewConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Division track', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, oneViewConfig, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: false,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
  });

  it('should load the initial config', (done) => {
    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Changes the axis to inner right', (done) => {
    const newOptions = {
      axisPositionHorizontal: 'right',
    };

    hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

    const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1');
    const { pAxis } = track.axis;

    // we want the axis labels to be to the left of the end of the track
    expect(pAxis.position.x).to.be.greaterThan(track.position[0]);
    expect(pAxis.children[0].x).to.be.lessThan(0);

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Changes the axis to outside right', (done) => {
    const newOptions = {
      axisPositionHorizontal: 'outsideRight',
    };

    hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

    const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1');
    const { pAxis } = track.axis;

    // we want the axis labels to be to the left of the end of the track
    expect(pAxis.position.x).to.be.greaterThan(track.position[0]);
    expect(pAxis.children[0].x).to.be.greaterThan(0);

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Changes the axis to outside left', (done) => {
    const newOptions = {
      axisPositionHorizontal: 'outsideLeft',
    };

    hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

    const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1');
    const { pAxis } = track.axis;

    // we want the axis labels to be to the left of the end of the track
    expect(pAxis.position.x).to.equal(track.position[0]);
    expect(pAxis.children[0].x).to.be.lessThan(0);

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Changes the axis to the left', (done) => {
    const newOptions = {
      axisPositionHorizontal: 'left',
    };

    hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

    const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1');
    const { pAxis } = track.axis;

    // we want the axis labels to be to the left of the end of the track
    expect(pAxis.position.x).to.equal(track.position[0]);
    expect(pAxis.children[0].x).to.be.greaterThan(0);

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Changes the axis to the top', (done) => {
    const newOptions = {
      axisPositionHorizontal: null,
      axisPositionVertical: 'top',
    };

    hgc.instance().handleTrackOptionsChanged('aa', 'vline1', newOptions);

    const track = getTrackObjectFromHGC(
      hgc.instance(),
      'aa',
      'vline1',
    ).originalTrack;
    const { pAxis } = track.axis;

    // we want the axis labels to be to the left of the end of the track
    expect(pAxis.position.x).to.equal(track.position[0]);
    expect(pAxis.children[0].x).to.be.greaterThan(0);

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Changes the axis to the outside top', (done) => {
    const newOptions = {
      axisPositionHorizontal: null,
      axisPositionVertical: 'outsideTop',
    };

    hgc.instance().handleTrackOptionsChanged('aa', 'vline1', newOptions);

    const track = getTrackObjectFromHGC(
      hgc.instance(),
      'aa',
      'vline1',
    ).originalTrack;
    const { pAxis } = track.axis;

    // we want the axis labels to be to the left of the end of the track
    expect(pAxis.position.x).to.equal(track.position[0]);
    expect(pAxis.children[0].x).to.be.lessThan(0);

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Changes the axis to the outside bottom', (done) => {
    const newOptions = {
      axisPositionHorizontal: null,
      axisPositionVertical: 'outsideBottom',
    };

    hgc.instance().handleTrackOptionsChanged('aa', 'vline1', newOptions);

    const track = getTrackObjectFromHGC(
      hgc.instance(),
      'aa',
      'vline1',
    ).originalTrack;
    const { pAxis } = track.axis;

    // we want the axis labels to be to the left of the end of the track
    expect(pAxis.position.x).to.be.greaterThan(track.position[0]);
    expect(pAxis.children[0].x).to.be.greaterThan(0);

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('Changes the axis to the bottom', (done) => {
    const newOptions = {
      axisPositionVertical: 'bottom',
    };

    hgc.instance().handleTrackOptionsChanged('aa', 'vline1', newOptions);

    const track = getTrackObjectFromHGC(
      hgc.instance(),
      'aa',
      'vline1',
    ).originalTrack;
    const { pAxis } = track.axis;

    // we want the axis labels to be to the left of the end of the track
    expect(pAxis.position.x).to.be.greaterThan(track.position[0]);
    expect(pAxis.children[0].x).to.be.lessThan(0);

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('should have a bottom track of height 0', (done) => {
    const height = hgc.instance().state.views.aa.tracks.bottom[0].height;
    expect(height).to.equal(0);

    waitForTilesLoaded(hgc.instance(), done);
  });
});
