// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
  waitForTilesLoaded,
} from '../../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../../app/scripts/utils';

import { oneViewConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Division track', () => {
  let hgc = null;
  let div = null;

  beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, oneViewConfig, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: false,
    });
  });

  afterAll(() => {
    removeHGComponent(div);
  });

  it('should load the initial config', async () => {
    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('Changes the axis to inner right', async () => {
    const newOptions = {
      axisPositionHorizontal: 'right',
    };

    hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

    const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1');
    const { pAxis } = track.axis;

    // we want the axis labels to be to the left of the end of the track
    expect(pAxis.position.x).to.be.greaterThan(track.position[0]);
    expect(pAxis.children[0].x).to.be.lessThan(0);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('Changes the axis to outside right', async () => {
    const newOptions = {
      axisPositionHorizontal: 'outsideRight',
    };

    hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

    const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1');
    const { pAxis } = track.axis;

    // we want the axis labels to be to the left of the end of the track
    expect(pAxis.position.x).to.be.greaterThan(track.position[0]);
    expect(pAxis.children[0].x).to.be.greaterThan(0);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('Changes the axis to outside left', async () => {
    const newOptions = {
      axisPositionHorizontal: 'outsideLeft',
    };

    hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

    const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1');
    const { pAxis } = track.axis;

    // we want the axis labels to be to the left of the end of the track
    expect(pAxis.position.x).to.equal(track.position[0]);
    expect(pAxis.children[0].x).to.be.lessThan(0);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('Changes the axis to the left', async () => {
    const newOptions = {
      axisPositionHorizontal: 'left',
    };

    hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);

    const track = getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1');
    const { pAxis } = track.axis;

    // we want the axis labels to be to the left of the end of the track
    expect(pAxis.position.x).to.equal(track.position[0]);
    expect(pAxis.children[0].x).to.be.greaterThan(0);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('Changes the axis to the top', async () => {
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

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('Changes the axis to the outside top', async () => {
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

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('Changes the axis to the outside bottom', async () => {
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

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('Changes the axis to the bottom', async () => {
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

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });

  it('should have a bottom track of height 0', async () => {
    const height = hgc.instance().state.views.aa.tracks.bottom[0].height;
    expect(height).to.equal(0);

    await new Promise((done) => waitForTilesLoaded(hgc.instance(), done));
  });
});
