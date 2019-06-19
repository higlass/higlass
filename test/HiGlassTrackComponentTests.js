/* eslint-env node, jasmine */
import {
  configure,
  mount,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import React from 'react';

import HiGlassTrackComponent from '../app/scripts/HiGlassTrackComponent';

configure({ adapter: new Adapter() });

describe('Simple HiGlassTrackComponent', () => {
  let div;
  let hgc;

  it('mounts', (done) => {
    div = global.document.createElement('div');

    const trackConfig = {
      server: '//higlass.io/api/v1',
      tilesetUid: 'CQMd6V_cRw6iCI_-Unl3PQ',
      type: 'heatmap',
      options: {
        colorRange: ['white', '#000'],
        heatmapValueScaling: 'log',
        scaleStartPercent: 0,
        scaleEndPercent: 1,
      }
    };

    hgc = mount(<HiGlassTrackComponent
        height={100}
        trackConfig={trackConfig}
        width={100}
        x={0}
        y={0}
    />, { attachTo: div });
  });

  afterEach(() => {
    if (hgc) {
      hgc.unmount();
      hgc.detach();
    }

    if (div) {
      global.document.body.removeChild(div);
    }
  });
});
