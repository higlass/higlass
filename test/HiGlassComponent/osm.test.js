// @ts-nocheck
import * as vi from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Enzyme from 'enzyme';

import {
  mountHGComponentAsync,
  removeHGComponent,
} from '../../app/scripts/test-helpers';

import { osmConf } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

vi.describe('osm', () => {
  let hgc = null;
  let div = null;

  vi.beforeAll(async () => {
    [div, hgc] = await mountHGComponentAsync(div, hgc, osmConf, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: false,
    });
  });

  vi.afterAll(() => {
    removeHGComponent(div);
  });

  vi.it('Switches to the osm tiles track', () => {
    const { views } = hgc.instance().state;
    const view = views.aa;

    view.tracks.center[0].type = 'osm-2d-tile-ids';
    view.tracks.center[0].uid = 'bb';
    hgc.setState({ views });
  });
});
