import React from 'react';

import toVoid from '../utils/to-void';

const { Provider, Consumer } = React.createContext({
  close: toVoid,
  open: toVoid,
});

// Trevor: Not sure how to type these HOCs correctly.
//
// We want the wrapped component to retain the same instance API while
// eliminating the need to pass `modal` explicitly.
//
// Ideally, we'd use Higher Kinded Types (HKT), but since TypeScript lacks them,
// we preserve the original type instead.
//
// This may cause instantiation errors (e.g., TS complaining about a missing `modal`),
// but I think this is acceptable because:
//
// 1. It only affects instantiation (we can ignore the error in one place).
// 2. We control instantiation, so this won't impact external consumers.
// 3. Explicitly passing the new props would erase type information for the rest of the API,
//    reducing type safety everywhere else.

/** @typedef {{ open: () => void, close: () => void }} Modal  */

/**
 * @template {typeof React.Component<{ modal?: Modal }>} T
 * @param {T} Component
 * @returns {T}
 */
function withModal(Component) {
  // @ts-expect-error See comment above
  return React.forwardRef((props, ref) =>
    React.createElement(Consumer, null, (/** @type {Modal} */ modal) =>
      React.createElement(Component, { ref, ...props, modal }),
    ),
  );
}

export default withModal;

export { Provider };
