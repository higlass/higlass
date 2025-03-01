import { afterAll, describe, expect, it } from 'vitest';

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
// @ts-expect-error - we don't have types for enzyme
import Enzyme from 'enzyme';

// Utils
import {
  mountHGComponentAsync,
  removeHGComponent,
} from '../app/scripts/test-helpers';

Enzyme.configure({ adapter: new Adapter() });

describe('HiGlass component creation tests', () => {
  afterAll(() => {});

  it('Ensures that the viewconf state is editable', async () => {
    const response = await fetch(
      'http://higlass.io/api/v1/viewconfs/?d=default',
    );
    const [div, hgc] = await mountHGComponentAsync(
      null,
      null,
      await response.json(),
    );
    expect(hgc.instance().state.viewConfig.editable).to.eql(true);
    removeHGComponent(div);
  });
});
