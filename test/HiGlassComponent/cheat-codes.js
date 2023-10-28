// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

import {
  mountHGComponent,
  removeHGComponent,
} from '../../app/scripts/test-helpers';

import { divisionViewConfig } from '../view-configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Cheat codes', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, divisionViewConfig, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
    // visual check that the heatmap track config menu is moved
    // to the left
  });

  after(async () => {
    removeHGComponent(div);
  });

  // it('Makes the track editable', () => {
  //   expect(hgc.instance().isEditable()).toBe(true);
  //   document.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
  //   document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
  //   document.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
  //   document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
  //   document.dispatchEvent(new KeyboardEvent('keydown', { key: 'i' }));
  //   document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
  //   hgc.update();
  //   // console.log('keyevent', keyEvent);
  //   //
  //   expect(hgc.instance().isEditable()).toBe(false);
  // });
});
