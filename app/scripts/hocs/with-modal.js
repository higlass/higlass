import React from 'react';

import toVoid from '../utils/to-void';

const { Provider, Consumer } = React.createContext({
  close: toVoid,
  open: toVoid,
});

// Higher order component
const withModal = (Component) =>
  React.forwardRef((props, ref) => (
    <Consumer>
      {(modal) => <Component ref={ref} {...props} modal={modal} />}
    </Consumer>
  ));

export default withModal;

export { Provider };
