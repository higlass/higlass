// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

import {
  mountHGComponent,
  removeHGComponent,
} from '../../app/scripts/test-helpers';

import { osmConf } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('osm', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, osmConf, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: false,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
  });

  it('Switches to the osm tiles track', () => {
    const { views } = hgc.instance().state;
    // console.log('views:', views);

    const view = views.aa;

    view.tracks.center[0].type = 'osm-2d-tile-ids';
    view.tracks.center[0].uid = 'bb';

    hgc.setState({
      views,
    });
  });
});
