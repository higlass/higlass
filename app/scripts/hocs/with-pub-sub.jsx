// @ts-nocheck
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';

import { toVoid } from '../utils';

/** @type {import('pub-sub-es').PubSub & { __fake__: true }} */
const fake = {
  __fake__: true,
  publish: toVoid,
  subscribe: () => ({ event: 'fake', handler: toVoid }),
  unsubscribe: toVoid,
  clear: toVoid,
};

const { Provider, Consumer } = React.createContext(fake);

// Higher order component
const withPubSub = (Component) =>
  React.forwardRef((props, ref) => (
    <Consumer>
      {(pubSub) => <Component ref={ref} {...props} pubSub={pubSub} />}
    </Consumer>
  ));

export default withPubSub;

export { fake, Provider };
