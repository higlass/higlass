import React from 'react';

import fakePubSub from '../utils/fake-pub-sub';

const { Provider, Consumer } = React.createContext(fakePubSub);

// Written without JSX to make it so we don't need JSX-transformation to load this file
function withPubSub(Component) {
  return React.forwardRef((props, ref) =>
    React.createElement(Consumer, null, (pubSub) =>
      React.createElement(Component, { ref, ...props, pubSub }),
    ),
  );
}

export default withPubSub;

export { Provider };
