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

import { testViewConfX2 } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Track addition and removal', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, testViewConfX2, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: false,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
  });

  it('should load the initial config', () => {
    // this was to test an example from the higlass-website demo page
    // where the issue was that the genome position search box was being
    // styled with a margin-bottom of 10px, fixed by setting the style of
    // genome-position-search to specify margin-bottom app/styles/GenomePositionSearchBox.css
    expect(hgc.instance().state.views.aa.layout.h).to.equal(6);
  });

  it('should change the opacity of the first text label to 20%', (done) => {
    const newOptions = JSON.parse(
      JSON.stringify(testViewConfX2.views[0].tracks.top[0].options),
    );
    newOptions.labelTextOpacity = 0.2;

    hgc.instance().handleTrackOptionsChanged('aa', 'line1', newOptions);
    hgc.setState(hgc.instance().state);

    expect(
      getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1').labelText.alpha,
    ).to.be.lessThan(0.21);

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('should change the stroke width of the second line to 5', (done) => {
    const newOptions = JSON.parse(
      JSON.stringify(testViewConfX2.views[0].tracks.top[1].options),
    );
    newOptions.lineStrokeWidth = 5;

    hgc.instance().handleTrackOptionsChanged('aa', 'line2', newOptions);
    hgc.setState(hgc.instance().state);

    expect(
      getTrackObjectFromHGC(hgc.instance(), 'aa', 'line1').labelText.alpha,
    ).to.be.lessThan(0.21);

    waitForTilesLoaded(hgc.instance(), done);
  });

  it('should do something else', (done) => {
    waitForTilesLoaded(hgc.instance(), done);
  });
});
