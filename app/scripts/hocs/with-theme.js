import React from 'react';

import toVoid from '../utils/to-void';

const { Provider, Consumer } = React.createContext({
  close: toVoid,
  open: toVoid,
});

// Higher order component
const withTheme = (Component) =>
  React.forwardRef((props, ref) => (
    <Consumer>
      {(theme) => <Component ref={ref} {...props} theme={theme} />}
    </Consumer>
  ));

export default withTheme;

export { Provider };
