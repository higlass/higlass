import React from 'react';
import * as themes from '../configs/themes';

/** @typedef {themes.THEME_LIGHT | themes.THEME_DARK} Theme */

const { Provider, Consumer } = React.createContext(
  /** @type {Theme} */ (themes.THEME_DEFAULT),
);

// Trevor: Not sure how to type these HOCs correctly.
// This is a workaround. See ./with-modal for more information.

/**
 * @template {typeof React.Component<{ theme?: Theme }>} T
 * @param {T} Component
 * @returns {T}
 */
function withTheme(Component) {
  // @ts-expect-error See comment in ./with-modal
  return React.forwardRef((props, ref) =>
    React.createElement(Consumer, null, (/** @type {Theme} */ theme) =>
      React.createElement(Component, { ref, ...props, theme }),
    ),
  );
}

export default withTheme;

export { Provider };
