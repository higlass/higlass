import React from 'react';

import fakePubSub from '../utils/fake-pub-sub';

const { Provider, Consumer } = React.createContext(fakePubSub);

// Trevor: Not sure how to type these HOCs correctly.
// This is a workaround. See ./with-modal for more information.

/** @import { PubSub } from 'pub-sub-es' */

/**
 * @template {typeof React.Component<{ pubSub?: PubSub }>} T
 * @param {T} Component
 * @returns {T}
 */
function withPubSub(Component) {
  // @ts-expect-error See comment in ./with-modal
  return React.forwardRef((props, ref) =>
    React.createElement(Consumer, null, (/** @type {PubSub} */ pubSub) =>
      React.createElement(Component, { ref, ...props, pubSub }),
    ),
  );
}

export default withPubSub;

export { Provider };
