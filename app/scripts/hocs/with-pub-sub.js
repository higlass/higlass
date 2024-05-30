import React from 'react';

import toVoid from '../utils/to-void';

const fake = {
  __fake__: true,
  publish: toVoid,
  subscribe: toVoid,
  unsubscribe: toVoid,
};

const { Provider, Consumer } = React.createContext(fake);

// Written without JSX to make it so we don't need JSX-transformation to load this file
function withPubSub(Component) {
  return React.forwardRef((props, ref) =>
    React.createElement(Consumer, null, (pubSub) =>
      React.createElement(Component, { ref, ...props, pubSub }),
    ),
  );
}

export default withPubSub;

export { fake, Provider };
