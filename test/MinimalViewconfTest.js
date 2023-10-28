// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

// Utils
import {
  mountHGComponent,
  removeHGComponent,
} from '../app/scripts/test-helpers';

Enzyme.configure({ adapter: new Adapter() });

describe('Minimal viewconfs', () => {
  describe('Crazy minimal', () => {
    const viewconf = {};
    let hgc = null;
    let div = null;
    before((done) => {
      [div, hgc] = mountHGComponent(div, hgc, viewconf, done);
    });
    it('can load and unload', () => {
      expect(true).to.equal(true);
    });
    after(() => {
      removeHGComponent(div);
    });
  });
  describe('Reasonably minimal', () => {
    const viewconf = {
      views: [
        {
          tracks: {
            top: [],
            left: [],
            center: [],
            right: [],
            bottom: [],
            whole: [],
            gallery: [],
          },
        },
      ],
    };
    let hgc = null;
    let div = null;
    before((done) => {
      [div, hgc] = mountHGComponent(div, hgc, viewconf, done);
    });
    it('can load and unload', () => {
      expect(true).to.equal(true);
    });
    after(() => {
      removeHGComponent(div);
    });
  });
  describe('Minimal with CrossRule', () => {
    const viewconf = {
      views: [
        {
          initialXDomain: [0, 200],
          initialYDomain: [0, 200],
          tracks: {
            whole: [
              {
                type: 'cross-rule',
                x: 100,
                y: 100,
              },
            ],
          },
        },
      ],
    };
    let hgc = null;
    let div = null;
    before((done) => {
      [div, hgc] = mountHGComponent(div, hgc, viewconf, done);
    });
    it('can load and unload', () => {
      expect(true).to.equal(true);
    });
    after(() => {
      removeHGComponent(div);
    });
  });
});
